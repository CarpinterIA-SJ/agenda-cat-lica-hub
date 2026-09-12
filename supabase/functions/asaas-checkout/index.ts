// ============================================================
//  Edge Function: asaas-checkout
//  Cria uma cobrança no Asaas (PIX / BOLETO / CREDIT_CARD).
//
//  Paralela ao stripe-checkout — o Stripe continua atendendo o fluxo
//  de produção e NENHUM arquivo dele é tocado. A lógica de negócio
//  (taxa da plataforma, cupom, soft-gate de vagas, rate limit) espelha
//  a do stripe-checkout deliberadamente: enquanto os dois convivem,
//  extrair um módulo comum exigiria alterar o stripe-checkout, o que
//  está fora de escopo até a Fase 5.
//
//  Modelo: taxa da plataforma paga pelo comprador (somada ao subtotal).
//  SEM split — o valor cai integralmente na conta Asaas do Guardião e o
//  repasse ao organizador segue manual (organization_payout_accounts /
//  withdrawal_requests).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@^3.23.8";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { buildLimitedSelections } from "../_shared/option-counts.ts";
import {
  ASAAS_PAID_STATUSES,
  AsaasError,
  asaasDueDate,
  createPayment,
  deletePayment,
  findOrCreateCustomer,
  getBoletoIdentification,
  getPayment,
  getPixQrCode,
  isAsaasConfigured,
  isValidCpfCnpj,
  onlyDigits,
  type AsaasBillingType,
} from "../_shared/asaas.ts";

const checkoutSchema = z.object({
  event_id: z.string().uuid({ message: "event_id deve ser um uuid válido" }),
  // Carrinho multi-tipo (migration 044): 1-10 linhas, cada uma com seu
  // próprio ticket_id/quantity. Duplicata de ticket_id dentro do array é
  // validada à parte (não pelo zod) — ver checagem logo após o parse.
  items: z.array(z.object({
    ticket_id: z.string().uuid({ message: "ticket_id deve ser um uuid válido" }),
    quantity: z.number().int().min(1).max(10),
  })).min(1, { message: "o carrinho precisa ter ao menos 1 item" }).max(10, { message: "máximo de 10 tipos de ingresso por carrinho" }),
  user_id:      z.string().uuid({ message: "user_id deve ser um uuid válido" }),
  billing_type: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  // O Asaas EXIGE cpfCnpj para criar o cliente — não há como criar cobrança
  // sem documento. profiles não guarda CPF, então ele vem do formulário.
  cpf:          z.string().min(11).max(18),
  phone:        z.string().max(20).nullish(),
  coupon_code:  z.string().max(50).nullish(),
  custom_fields: z.record(z.any()).optional(),
});

/**
 * Piso de cobrança por método, em centavos.
 *
 * Hoje os três estão em R$ 5,00 — o mesmo piso do Stripe (src/lib/pricing.ts).
 * O enunciado da Fase 2 levantou que o PIX no Asaas talvez aceite menos: é
 * plausível, mas NÃO foi confirmado contra a documentação/sandbox, e chutar
 * um piso menor troca um erro claro nosso por um 400 cru do Asaas no meio do
 * checkout. Mantido em 500 até medição no sandbox (roteiro no relatório);
 * baixar o PIX depois é trocar um número aqui.
 */
const MIN_CHARGE_CENTS: Record<AsaasBillingType, number> = {
  PIX: 500,
  BOLETO: 500,
  CREDIT_CARD: 500,
};

/** Prazo default até o vencimento, por método (dias), quando o organizador não configurou. */
const DEFAULT_DUE_DAYS: Record<AsaasBillingType, number> = {
  PIX: 1,
  BOLETO: 3,
  CREDIT_CARD: 1,
};

/** billingType do Asaas → enum payment_method do banco. */
const METHOD_BY_BILLING_TYPE: Record<AsaasBillingType, string> = {
  PIX: "pix",
  BOLETO: "boleto",
  CREDIT_CARD: "credit_card",
};

/**
 * Margem além do fim do dia do vencimento antes de a reserva expirar.
 * O Asaas granula vencimento por DIA, não por hora/minuto — marcar OVERDUE
 * já pode acontecer logo após a virada do dia do dueDate. A margem dá
 * folga para um PIX compensado de madrugada ainda confirmar antes que a
 * reserva seja liberada por outra pessoa. SEM medição de produção para
 * calibrar este número — 24h é ponto de partida deliberadamente
 * conservador, revisitar com dados reais depois do primeiro lote de PIX.
 */
const RESERVATION_EXPIRY_MARGIN_HOURS = 24;

/** Fim do dia (23:59:59, horário de Brasília) do dueDate + margem, em ISO UTC. */
function reservationExpiresAt(dueDateStr: string): string {
  const endOfDay = new Date(`${dueDateStr}T23:59:59-03:00`);
  endOfDay.setUTCHours(endOfDay.getUTCHours() + RESERVATION_EXPIRY_MARGIN_HOURS);
  return endOfDay.toISOString();
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Mesmo teto do stripe-checkout: 10 tentativas por usuário a cada 10 min.
const CHECKOUT_RATE_MAX = 10;
const CHECKOUT_RATE_WINDOW_SECONDS = 600;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflightResponse(req);

  const cors = corsHeadersFor(req);
  const json = (payload: unknown, status = 200): Response =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  // Inscrição criada antes da cobrança: se o Asaas falhar, é cancelada no catch.
  let createdRegistrationId: string | null = null;
  // ...mas SÓ enquanto não houver cobrança emitida. Depois que a cobrança
  // existe no Asaas ela é pagável, e cancelar a inscrição aqui (por uma falha
  // ao buscar o QR Code, por exemplo) deixaria um pagamento válido sem
  // inscrição correspondente.
  let chargeCreated = false;
  // Cupom consumido antes da cobrança: se a cobrança não nascer, o uso é
  // devolvido no catch. Declarado aqui, fora do try, para o catch enxergar.
  let consumedCouponId: string | null = null;
  // Fase 5: reserva atômica feita (reserve_ticket_items). Se a cobrança
  // falhar depois disso, o catch libera a vaga (release_ticket_reservation)
  // — senão ela fica presa até expirar. Mesma condição !chargeCreated do
  // cancelamento da inscrição: cobrança emitida = reserva legitimamente
  // held até o pagamento ou a expiração natural.
  let reservationHeld = false;

  // Único ponto que devolve o uso do cupom. Mesma condição do catch (linha
  // ~503 abaixo): só libera se ESTA requisição consumiu e a cobrança ainda
  // não nasceu — nascida a cobrança ela é pagável, e quem devolve o cupom
  // nesse caso é o estorno/vencimento, no webhook. Reaproveitado tanto pelos
  // gates de rejeição ANTES da cobrança quanto pelo catch.
  const releaseCouponIfConsumed = async () => {
    if (!consumedCouponId || chargeCreated) return;
    const { error: relErr } = await supabaseAdmin
      .rpc("release_coupon_use", { p_coupon_id: consumedCouponId });
    if (relErr) console.error("[asaas-checkout] release_coupon_use falhou", relErr);
  };

  // Conveniência para os gates de rejeição: libera o cupom (se consumido) e
  // devolve o erro num ponto só.
  const rejectAndReleaseCoupon = async (payload: unknown, status: number) => {
    await releaseCouponIfConsumed();
    return json(payload, status);
  };

  try {
    // 1) Configuração obrigatória.
    const missingEnv: string[] = [];
    if (!isAsaasConfigured()) missingEnv.push("ASAAS_API_KEY");
    if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missingEnv.length) {
      console.error("[asaas-checkout] variáveis de ambiente ausentes:", missingEnv.join(", "));
      return json(
        { error: `Configuração do servidor incompleta: ${missingEnv.join(", ")} não definida(s).` },
        500,
      );
    }

    // 2) Autenticação obrigatória — o comprador é sempre o dono do token.
    const authHeader = req.headers.get("Authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      return json({ error: "Autenticação obrigatória para iniciar um pagamento." }, 401);
    }
    const { data: caller, error: callerErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (callerErr || !caller?.user) {
      return json({ error: "Sessão inválida ou expirada. Faça login novamente." }, 401);
    }
    const callerId = caller.user.id;

    // 3) Payload. Nunca logamos o CPF junto — é dado pessoal.
    const raw = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "payload";
      return json({ error: `Dados inválidos: ${field} — ${issue.message}` }, 400);
    }
    const {
      event_id, items, user_id, billing_type,
      cpf, phone, coupon_code, custom_fields,
    } = parsed.data;

    console.log("[asaas-checkout] início:", JSON.stringify({
      event_id, item_count: items.length, billing_type, has_coupon: !!coupon_code,
    }));

    if (user_id !== callerId) {
      console.warn("[asaas-checkout] user_id divergente do token", { callerId });
      return json({ error: "Não é possível comprar ingressos em nome de outro usuário." }, 403);
    }

    if (!isValidCpfCnpj(cpf)) {
      return json({
        error: "cpf_invalido",
        message: "CPF/CNPJ inválido. Confira os números e tente novamente.",
      }, 400);
    }

    // 3b) Duplicata de payload — mesmo ticket_id em 2 linhas do carrinho.
    // Checado ANTES de qualquer soft-gate/reserva: DUPLICATE_HOLD vindo de
    // reserve_ticket_items (mais abaixo) só existe pra pegar exatamente
    // este caso (unique_violation em ticket_reservations por
    // registration_id+ticket_id repetido na MESMA chamada) — barrar aqui dá
    // uma mensagem clara em vez de deixar a RPC estourar um erro genérico
    // no meio da transação.
    {
      const ids = items.map((i) => i.ticket_id);
      if (new Set(ids).size !== ids.length) {
        return json({
          error: "ingresso_duplicado",
          message: "O mesmo tipo de ingresso aparece mais de uma vez no carrinho. Ajuste as quantidades e tente de novo.",
        }, 400);
      }
    }

    // 4) Rate limit server-side (mesma RPC da migration 026).
    const { data: allowed, error: rateErr } = await supabaseAdmin.rpc("consume_rate_limit", {
      p_key: `asaas-checkout:${callerId}`,
      p_max: CHECKOUT_RATE_MAX,
      p_window_seconds: CHECKOUT_RATE_WINDOW_SECONDS,
    });
    if (rateErr) {
      console.warn("[asaas-checkout] consume_rate_limit indisponível:", rateErr.message);
    } else if (allowed === false) {
      return json({
        error: "rate_limited",
        message: "Muitas tentativas de pagamento em pouco tempo. Aguarde alguns minutos e tente novamente.",
      }, 429);
    }

    // 5) Ingressos — busca em lote, 1 round-trip pro carrinho inteiro.
    // payment_deadline_minutes incluído aqui (era uma query separada, mais
    // abaixo, de quando só existia 1 ticket_id por checkout).
    const ticketIds = items.map((i) => i.ticket_id);
    const { data: ticketRows, error: ticketErr } = await supabaseAdmin
      .from("event_tickets")
      .select("id, name, price_cents, event_id, quantity, sold, reserved, lot_group, sales_start_at, sales_end_at, payment_deadline_minutes")
      .in("id", ticketIds);
    if (ticketErr) {
      console.error("[asaas-checkout] erro ao buscar ingressos:", ticketErr);
      return json({ error: `Falha ao buscar os ingressos: ${ticketErr.message}` }, 500);
    }
    const ticketsById = new Map((ticketRows ?? []).map((t) => [t.id, t]));
    for (const id of ticketIds) {
      if (!ticketsById.has(id)) {
        return json({ error: "Ingresso não encontrado. Verifique se o ingresso ainda está disponível." }, 400);
      }
      if (ticketsById.get(id)!.event_id !== event_id) {
        return json({ error: "Este ingresso não pertence ao evento informado." }, 400);
      }
    }

    // 6b) Evento aberto para inscrição — mesmo predicado de
    // event_is_public_active() OR is_event_org_admin() que a policy
    // "registrations: auto-inscrição em evento público OR admin" (003:194-202)
    // e create_free_registration (033) já exigem. Faltava aqui: sem isso,
    // qualquer autenticado cria inscrição pendente + cobrança Asaas para
    // evento draft/pausado/arquivado/privado, sem ser dono/admin da org —
    // usando supabaseAdmin (service_role), que bypassa a RLS que bloquearia
    // isso numa query direta do cliente.
    const { data: event, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("organization_id, name, visibility, status")
      .eq("id", event_id)
      .maybeSingle();
    if (eventErr || !event) {
      return json({ error: "Evento não encontrado." }, 404);
    }

    const eventIsPublicActive = event.visibility === "public" && event.status === "active";
    let callerIsEventOrgAdmin = false;
    if (!eventIsPublicActive) {
      const { data: membership } = await supabaseAdmin
        .from("organization_members")
        .select("role")
        .eq("organization_id", event.organization_id)
        .eq("user_id", callerId)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      callerIsEventOrgAdmin = !!membership;
    }
    if (!eventIsPublicActive && !callerIsEventOrgAdmin) {
      console.warn("[asaas-checkout] evento fechado para compra", {
        event_id, status: event.status, visibility: event.visibility,
      });
      return json({
        error: "evento_fechado",
        message: "Este evento não está aberto para inscrições no momento.",
      }, 403);
    }

    // Prazo configurado pelo organizador (migration 010, coluna opcional) —
    // já veio junto no fetch em lote acima. Com carrinho multi-tipo, cada
    // linha pode ter um prazo diferente configurado; usa o MENOR entre os
    // que existem (mais conservador — a reserva expira no prazo mais curto
    // do carrinho, nunca deixa um tipo com prazo curto esperar o de outro
    // mais longo). Ausente em todos os itens: cai no default por método
    // (DEFAULT_DUE_DAYS), como sempre foi.
    const deadlineCandidates = items
      .map((i) => ticketsById.get(i.ticket_id)!.payment_deadline_minutes)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const deadlineMin = deadlineCandidates.length > 0 ? Math.min(...deadlineCandidates) : null;

    // 6) Taxa da plataforma — SEMPRE recalculada server-side.
    const { data: setting, error: settingErr } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "taxa_plataforma_percent")
      .maybeSingle();
    if (settingErr) {
      console.warn("[asaas-checkout] erro ao ler taxa_plataforma_percent, usando 5:", settingErr.message);
    }
    const parsedPercent = Number(setting?.value);
    const taxaPercent = Number.isFinite(parsedPercent) && parsedPercent >= 0 ? parsedPercent : 5;

    let subtotal = items.reduce(
      (sum, i) => sum + ticketsById.get(i.ticket_id)!.price_cents * i.quantity,
      0,
    );

    if (coupon_code) {
      // consume_coupon (migration 033) é check-and-increment ATÔMICO: o
      // limite vive no WHERE do UPDATE, então duas compras simultâneas do
      // último uso serializam no lock da linha e a segunda falha.
      //
      // O `select` que estava aqui apenas LIA used_count — e nada, em lugar
      // nenhum do projeto, chegava a incrementá-lo. max_uses era decorativo.
      const { data: consumedId, error: couponErr } = await supabaseAdmin
        .rpc("consume_coupon", { p_event_id: event_id, p_code: coupon_code });

      if (couponErr) {
        // Estourou entre a tela e o checkout. NÃO cobra o valor cheio em
        // silêncio: o participante viu um preço com desconto, e cobrar outro
        // é pior que recusar. O front reapresenta o valor sem cupom e pede
        // confirmação explícita.
        console.warn("[asaas-checkout] cupom indisponível:", coupon_code, couponErr.message);
        return json({
          error: "cupom_esgotado",
          message: "Este cupom acabou de esgotar. Confira o novo valor antes de continuar.",
        }, 409);
      }

      consumedCouponId = consumedId as string;

      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("discount_kind, discount_value")
        .eq("id", consumedCouponId)
        .maybeSingle();
      if (coupon) {
        if (coupon.discount_kind === "percent") {
          subtotal = Math.max(0, Math.round(subtotal - subtotal * (Number(coupon.discount_value) / 100)));
        } else {
          subtotal = Math.max(0, subtotal - Math.round(Number(coupon.discount_value) * 100));
        }
      }
    }

    const taxa = Math.round(subtotal * (taxaPercent / 100));
    const total = subtotal + taxa;

    if (total < 1) return await rejectAndReleaseCoupon({ error: "Valor total inválido para cobrança." }, 400);

    const minCents = MIN_CHARGE_CENTS[billing_type];
    if (total < minCents) {
      return await rejectAndReleaseCoupon({
        error: "valor_minimo",
        message: `O valor total ficou em R$ ${(total / 100).toFixed(2).replace(".", ",")}, abaixo do mínimo de R$ ${(minCents / 100).toFixed(2).replace(".", ",")} aceito para ${billing_type === "PIX" ? "PIX" : billing_type === "BOLETO" ? "boleto" : "cartão"}. Adicione mais ingressos ou peça ao organizador para ajustar o preço.`,
      }, 400);
    }

    // 7) Soft-gate de vagas por opção (Fase C) — idêntico ao stripe-checkout:
    // rejeita ANTES de cobrar se a opção já esgotou. A contagem DEFINITIVA
    // (tally_option_counts) acontece no webhook, na confirmação.
    if (custom_fields && Object.keys(custom_fields).length) {
      const { data: ev } = await supabaseAdmin
        .from("events")
        .select("custom_fields")
        .eq("id", event_id)
        .maybeSingle();
      const selections = buildLimitedSelections((ev as any)?.custom_fields, custom_fields);
      if (selections.length) {
        const { data: counts } = await supabaseAdmin
          .from("event_option_counts")
          .select("field_id, option_label, count")
          .eq("event_id", event_id);
        const used = new Map<string, number>();
        for (const c of (counts as any[]) ?? []) used.set(`${c.field_id}::${c.option_label}`, c.count);
        for (const s of selections) {
          const cur = used.get(`${s.field_id}::${s.option_label}`) ?? 0;
          if (cur >= s.limit) {
            return await rejectAndReleaseCoupon({ error: `A opção "${s.option_label}" esgotou. Volte ao formulário e escolha outra.` }, 409);
          }
        }
      }
    }

    // Soft-gate de capacidade do INGRESSO — mesmo padrão do soft-gate de
    // opção logo acima: rejeita ANTES de criar a cobrança quando já não há
    // vaga. Carrinho multi-tipo: roda 1x por item, contra o event_ticket
    // correspondente.
    //
    // NÃO É ATÔMICO: é uma leitura isolada, sem lock. Dois compradores
    // simultâneos na última vaga podem os dois passar por aqui e os dois
    // criarem cobrança — isto fecha só o caso comum (ingresso já esgotado
    // quando o comprador chega ao checkout), não a corrida. Controle
    // definitivo (check-and-increment atômico via reserve_ticket_items,
    // migration 044) fica pra chamada mais abaixo.
    //
    // quantity = 0 é a convenção de "ilimitado" (schema desde 003): nesse
    // caso nunca barra.
    for (const item of items) {
      const t = ticketsById.get(item.ticket_id)!;
      if (t.quantity > 0 && t.sold + t.reserved >= t.quantity) {
        return await rejectAndReleaseCoupon({
          error: "ticket_esgotado",
          message: `O ingresso "${t.name}" esgotou. A última vaga foi preenchida enquanto a cobrança era preparada.`,
        }, 409);
      }
    }

    // 7b) Defesa em profundidade — lote sequencial (migration 042). Mesmo
    // padrão do soft-gate acima: barra ANTES de reservar/cobrar quando o
    // ingresso pertence a uma cadeia (lot_group) e não é o vigente (primeiro,
    // por sort_order, com sold + reserved < quantity). NÃO É ATÔMICO — mesma
    // ressalva do soft-gate de capacidade: fecha o caso comum (front
    // desatualizado ou burlado), não a corrida no instante exato da virada
    // de lote. Bypass de organizador/admin do evento (migration 043, mesmo
    // padrão do 7c abaixo) — callerIsEventOrgAdmin já veio do gate 6b, sem
    // recalcular.
    // Carrinho multi-tipo: roda 1x por item — 2 itens do MESMO lot_group
    // buscam os irmãos 2 vezes (sem cache entre iterações), custo aceito
    // pela simplicidade num carrinho tipicamente pequeno.
    for (const item of items) {
      const t = ticketsById.get(item.ticket_id)!;
      if (!t.lot_group) continue;
      const { data: siblingLots, error: siblingErr } = await supabaseAdmin
        .from("event_tickets")
        .select("id, quantity, sold, reserved")
        .eq("event_id", event_id)
        .eq("lot_group", t.lot_group)
        .order("sort_order", { ascending: true });
      if (siblingErr) {
        console.error("[asaas-checkout] falha ao verificar lote vigente:", siblingErr);
        return await rejectAndReleaseCoupon({ error: "Falha ao verificar disponibilidade do lote." }, 500);
      }
      const currentLot = (siblingLots ?? []).find(
        (s) => !(s.quantity > 0 && s.sold + s.reserved >= s.quantity),
      );
      if ((!currentLot || currentLot.id !== t.id) && !callerIsEventOrgAdmin) {
        return await rejectAndReleaseCoupon({
          error: "lote_indisponivel",
          message: `O lote do ingresso "${t.name}" não está mais disponível. Atualize a página para ver o lote vigente.`,
        }, 409);
      }
    }

    // 7c) Defesa em profundidade — janela de vendas (migration 043). Mesmo
    // padrão do 7b. NÃO É ATÔMICO, mesma ressalva. Bypass de organizador/
    // admin do evento — mesmo callerIsEventOrgAdmin do gate 6b.
    // Carrinho multi-tipo: roda 1x por item.
    for (const item of items) {
      const t = ticketsById.get(item.ticket_id)!;
      if (!t.sales_start_at && !t.sales_end_at) continue;
      const nowTs = new Date();
      const notStarted = !!t.sales_start_at && nowTs < new Date(t.sales_start_at);
      const ended = !!t.sales_end_at && nowTs > new Date(t.sales_end_at);
      if ((notStarted || ended) && !callerIsEventOrgAdmin) {
        return await rejectAndReleaseCoupon({
          error: notStarted ? "vendas_nao_iniciadas" : "vendas_encerradas",
          message: notStarted
            ? `As vendas do ingresso "${t.name}" ainda não começaram.`
            : `As vendas do ingresso "${t.name}" já encerraram.`,
        }, 409);
      }
    }

    // 8) `event` (organization_id/name) já veio do gate 6b acima — sem refetch.

    // 9) Dados do comprador.
    let fullName = "Participante";
    let email = "";
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (authUser?.user) {
      email = authUser.user.email ?? "";
      fullName = (authUser.user.user_metadata?.full_name as string) || fullName;
    }
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", user_id)
      .maybeSingle();
    if (profile?.name) fullName = profile.name;

    // "Ticket principal" pra coluna legada event_registrations.ticket_id —
    // mesma convenção da 044 em create_free_registration: a linha de maior
    // valor total (quantity × price) do carrinho, só pra exibição/relatório
    // enquanto o front não lê registration_ticket_items. Não afeta reserva
    // nem cobrança — essas usam o array `items` completo.
    const mainTicketId = items.reduce((best, i) => {
      const bestVal = ticketsById.get(best.ticket_id)!.price_cents * best.quantity;
      const curVal = ticketsById.get(i.ticket_id)!.price_cents * i.quantity;
      return curVal > bestVal ? i : best;
    }, items[0]).ticket_id;

    const registrationFields = {
      event_id,
      ticket_id: mainTicketId,
      user_id,
      full_name: fullName,
      email: email || "sem-email@guardiaoeventos.com",
      cpf: onlyDigits(cpf),
      phone: phone ? onlyDigits(phone) : null,
      status: "pending",
      custom_fields: custom_fields ?? {},
    };

    // Resolve um pedido 'pending' antigo do MESMO usuário+evento (índice
    // registrations_one_pending_per_user_event, migration 044) — sucessora
    // do antigo fluxo DUPLICATE_HOLD de reserve_ticket_sold, que vivia lá
    // embaixo perto da reserva. Agora o gate é no INSERT, mais cedo, porque
    // é isto que a 044 amarrou por (user_id, event_id).
    const resolveDuplicatePending = async (): Promise<
      { ok: true } | { ok: false; response: Response }
    > => {
      // a) Localiza o pending existente. .maybeSingle() de propósito — não
      // confia cegamente na garantia do índice: se a query não achar nada
      // (drift entre índice e leitura, ou corrida rara), trata como erro
      // duro, não tenta reconciliar às cegas.
      const { data: oldReg, error: oldRegErr } = await supabaseAdmin
        .from("event_registrations")
        .select("id, gateway_charge_id")
        .eq("user_id", callerId)
        .eq("event_id", event_id)
        .eq("status", "pending")
        .maybeSingle();
      if (oldRegErr || !oldReg) {
        console.error("[asaas-checkout] unique_violation sem pending localizável", oldRegErr);
        return {
          ok: false,
          response: json({ error: "Não foi possível verificar sua inscrição anterior. Tente novamente." }, 500),
        };
      }

      // b) Status ATUAL da cobrança antiga — nunca o que foi lido antes.
      let chargeStatus: string | null = null;
      if (oldReg.gateway_charge_id) {
        try {
          const charge = await getPayment(oldReg.gateway_charge_id);
          chargeStatus = (charge.status ?? "").toUpperCase();
        } catch (e) {
          if (!(e instanceof AsaasError && e.status === 404)) {
            console.error("[asaas-checkout] falha ao consultar cobrança anterior", e);
            return {
              ok: false,
              response: json({ error: "Não foi possível verificar sua cobrança anterior. Tente novamente em instantes." }, 502),
            };
          }
          // 404: segue com chargeStatus null — trata como "já não existe".
        }
      }

      // c) Paga: aborta o checkout novo. Não apaga nada, não libera nada.
      if (chargeStatus !== null && ASAAS_PAID_STATUSES.has(chargeStatus)) {
        return {
          ok: false,
          response: json({
            error: "inscricao_ja_paga",
            message: "Você já tem uma inscrição confirmada para este evento.",
          }, 409),
        };
      }

      // d) Não paga: apaga a cobrança ANTES de liberar a vaga — só quando
      // ela ainda existe (chargeStatus !== null). Se o DELETE falhar (fora
      // 404), NÃO libera e NÃO segue: o pedido antigo fica intacto até uma
      // nova tentativa — mesma regra do reconcile-payments (falha no DELETE
      // nunca libera a vaga, o QR do PIX segue pagável por até 12 meses).
      if (chargeStatus !== null) {
        try {
          await deletePayment(oldReg.gateway_charge_id);
        } catch (e) {
          if (!(e instanceof AsaasError && e.status === 404)) {
            console.error("[asaas-checkout] falha ao apagar cobrança anterior", e);
            return {
              ok: false,
              response: json({ error: "Não foi possível liberar sua reserva anterior. Tente novamente." }, 502),
            };
          }
          // 404: cobrança já não existe — segue como sucesso.
        }
      }

      const { error: relErr } = await supabaseAdmin.rpc("release_ticket_reservation", {
        p_registration_id: oldReg.id,
      });
      if (relErr) {
        console.error("[asaas-checkout] release_ticket_reservation falhou", relErr);
        return {
          ok: false,
          response: json({ error: "Não foi possível liberar sua reserva anterior. Tente novamente." }, 500),
        };
      }

      // Tira a linha antiga do 'pending' — é o que libera o índice pro
      // INSERT novo conseguir entrar.
      const { error: cancelErr } = await supabaseAdmin
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", oldReg.id)
        .eq("status", "pending");
      if (cancelErr) {
        console.error("[asaas-checkout] falha ao cancelar inscrição pendente antiga", cancelErr);
        return {
          ok: false,
          response: json({ error: "Não foi possível liberar sua inscrição anterior. Tente novamente." }, 500),
        };
      }

      return { ok: true };
    };

    // 10) Inscrição PENDING criada ANTES da cobrança.
    // Ordem deliberada: o Asaas só aceita `externalReference` (uma string,
    // sem mapa de metadata como o Stripe), então precisamos do id da
    // inscrição já existindo para amarrá-lo à cobrança. Se o Asaas falhar
    // depois disso, o catch cancela esta inscrição.
    let registration: { id: string } | null = null;
    {
      const { data: firstAttempt, error: regErr } = await supabaseAdmin
        .from("event_registrations")
        .insert(registrationFields)
        .select("id")
        .single();

      if (!regErr) {
        registration = firstAttempt;
      } else if (regErr.code === "23505" && regErr.message?.includes("registrations_one_pending_per_user_event")) {
        // unique_violation da migration 044 — resolve o pedido antigo e
        // tenta o INSERT UMA vez a mais (nunca em loop: se colidir de novo
        // depois de resolvido, é bug ou corrida entre 2 requisições
        // concorrentes idênticas — erro sobe, não insiste).
        const resolved = await resolveDuplicatePending();
        if (!resolved.ok) return resolved.response;

        const { data: retryAttempt, error: retryErr } = await supabaseAdmin
          .from("event_registrations")
          .insert(registrationFields)
          .select("id")
          .single();
        if (retryErr || !retryAttempt) {
          console.error("[asaas-checkout] falha ao criar inscrição pendente (retry pós-reconciliação)", retryErr);
          return json({ error: "Não foi possível iniciar sua inscrição. Tente novamente." }, 500);
        }
        registration = retryAttempt;
      } else {
        console.error("[asaas-checkout] falha ao criar inscrição pendente", regErr);
        return json({ error: "Não foi possível iniciar sua inscrição. Tente novamente." }, 500);
      }
    }
    createdRegistrationId = registration.id;

    // 10b) Prazo de vencimento — ANTES do POST /payments no Asaas.
    // Ordem é o núcleo da Fase 5 (migration 031/039/044): reservar primeiro,
    // cobrar depois.
    //
    // dueDays/dueDateStr calculados AQUI, não lá embaixo no createPayment:
    // a expiração da reserva precisa usar a MESMA data do vencimento da
    // cobrança. Calcular duas vezes arriscaria 1 dia de drift bem na
    // virada da meia-noite.
    const dueDays = deadlineMin && deadlineMin > 0
      ? Math.min(Math.max(Math.ceil(deadlineMin / 1440), 1), 60)
      : DEFAULT_DUE_DAYS[billing_type];
    const dueDateStr = asaasDueDate(dueDays);
    const reservationExpiresAtIso = reservationExpiresAt(dueDateStr);

    // 10c) RESERVA atômica de TODAS as linhas do carrinho — uma chamada só,
    // mesma transação (migration 044). O soft-gate do passo 7 acima segue
    // como filtro barato de UX; quem decide de verdade é reserve_ticket_items,
    // check-and-increment atômico por linha, dentro da mesma transação
    // Postgres.
    //
    // DUPLICATE_HOLD vindo desta RPC não tem mais o significado de "outro
    // pedido seu está em aberto" — isso já foi resolvido lá em cima, no
    // INSERT de event_registrations (índice
    // registrations_one_pending_per_user_event). Aqui só pode significar
    // ticket_id repetido no payload dentro da MESMA chamada — já barrado no
    // passo 3b, antes de qualquer soft-gate. Sem retry/resolução: se
    // acontecer mesmo assim (corrida entre 2 requisições idênticas
    // concorrentes), é 409 direto.
    //
    // ATENÇÃO: reserve_ticket_items (044) ainda não aceita p_expires_at —
    // hardcoda 15 minutos internamente. Esta chamada PRESUME que uma
    // migration adicional acrescentou o parâmetro antes de ir pra produção
    // (ver nota no resumo da implementação).
    const { error: reserveErr } = await supabaseAdmin.rpc("reserve_ticket_items", {
      p_registration_id: registration.id,
      p_event_id: event_id,
      p_items: items.map((i) => ({ ticket_id: i.ticket_id, quantity: i.quantity })),
      p_expires_at: reservationExpiresAtIso,
    });

    if (reserveErr) {
      if (reserveErr.code === "P0001") {
        if (reserveErr.message === "TICKET_FULL") {
          return await rejectAndReleaseCoupon({
            error: "ticket_esgotado",
            message: "Um dos ingressos do carrinho esgotou. A última vaga foi preenchida enquanto a cobrança era preparada.",
          }, 409);
        }
        if (reserveErr.message === "TICKET_NOT_FOUND") {
          return json({ error: "Ingresso não encontrado para reserva. Tente novamente." }, 400);
        }
        if (reserveErr.message === "INVALID_QUANTITY") {
          return json({ error: "Quantidade inválida para reserva." }, 400);
        }
        if (reserveErr.message === "EMPTY_CART") {
          return json({ error: "Carrinho vazio." }, 400);
        }
        if (reserveErr.message === "DUPLICATE_HOLD") {
          return json({
            error: "reserva_duplicada",
            message: "Você já tem uma reserva em andamento para este evento. Tente novamente em instantes.",
          }, 409);
        }
      }
      // Erro inesperado da RPC — nenhum dos códigos conhecidos.
      throw new Error(reserveErr.message ?? "Falha ao reservar a vaga.");
    }
    reservationHeld = true;

    // Nome composto do carrinho pra description da cobrança e pra tela —
    // "2x Inscrição + 1x Kids". Usado nos dois lugares abaixo.
    const cartLabel = items
      .map((i) => `${i.quantity}x ${ticketsById.get(i.ticket_id)!.name}`)
      .join(" + ");

    // 11) Cliente no Asaas (reaproveitado por CPF/CNPJ).
    const customer = await findOrCreateCustomer({
      name: fullName,
      cpfCnpj: cpf,
      email: email || undefined,
      mobilePhone: phone ?? undefined,
      externalReference: user_id,
    });

    // 12) Cobrança. dueDays/dueDateStr já calculados no passo 10b — mesma
    // data usada para a expiração da reserva, sem recálculo. valueCents
    // continua sendo o total já somado — createPayment não muda, só quem
    // monta `total` antes dele (agora soma todos os itens do carrinho).
    const charge = await createPayment({
      customer: customer.id,
      billingType: billing_type,
      valueCents: total,
      dueDate: dueDateStr,
      description: `${cartLabel} — ${event.name}`.slice(0, 500),
      externalReference: registration.id,
    });
    chargeCreated = true;

    // 13) Amarra a cobrança à inscrição (coluna neutra da migration 027) e
    // grava a fatura hospedada (migration 037) — é o que permite o
    // participante retomar um pagamento pendente em Meus Ingressos.
    const { error: linkErr } = await supabaseAdmin
      .from("event_registrations")
      .update({ gateway_charge_id: charge.id, gateway_invoice_url: charge.invoiceUrl ?? null })
      .eq("id", registration.id);
    if (linkErr) {
      // Sem esse vínculo o webhook não acha a inscrição — falha dura.
      console.error("[asaas-checkout] falha ao vincular gateway_charge_id", linkErr);
      throw new Error("Não foi possível vincular a cobrança à inscrição.");
    }

    // 14) Pagamento PENDING.
    // O Asaas não carrega metadata arbitrária, então o que o webhook vai
    // precisar fica aqui — gateway_payload é jsonb e existe exatamente para
    // dados específicos do gateway. UNIQUE(gateway_transaction_id) torna
    // este insert idempotente.
    //
    // `items` substitui os antigos `quantity`/`ticket_id` singulares —
    // webhook/reconcile-payments (045) só leem esses dois campos no
    // fallback legado (registro sem linha em ticket_reservations, que um
    // pedido multi-tipo nunca tem — sempre passa por reserve_ticket_items).
    const { error: payErr } = await supabaseAdmin.from("payments").insert({
      organization_id: event.organization_id,
      event_id,
      registration_id: registration.id,
      amount_cents: total,
      fee_cents: taxa,
      net_cents: total - taxa,
      currency: "BRL",
      method: METHOD_BY_BILLING_TYPE[billing_type],
      status: "pending",
      gateway: "asaas",
      gateway_transaction_id: charge.id,
      // Coluna existe desde a 003:424 e nunca foi preenchida. Sem ela, a
      // devolução do uso no estorno não sabe qual cupom devolver.
      coupon_id: consumedCouponId,
      gateway_payload: {
        items: items.map((i) => ({
          ticket_id: i.ticket_id,
          quantity: i.quantity,
          price_cents: ticketsById.get(i.ticket_id)!.price_cents,
        })),
        billing_type,
        subtotal_cents: subtotal,
        fee_cents: taxa,
        coupon_code: coupon_code ?? null,
        due_date: charge.dueDate,
        invoice_url: charge.invoiceUrl ?? null,
      },
    });
    if (payErr) {
      // Não derruba a compra: o webhook tem fallback de insert. Mas registra
      // alto, porque sem esta linha o webhook perde os itens/taxa.
      console.error("[asaas-checkout] falha ao criar payment pendente", payErr);
    }

    // 15) Dados específicos do método para a tela.
    const base = {
      registration_id: registration.id,
      charge_id: charge.id,
      billing_type,
      subtotal,
      taxa,
      total,
      ticket_name: cartLabel,
      due_date: charge.dueDate,
      invoice_url: charge.invoiceUrl ?? null,
    };

    if (billing_type === "PIX") {
      // Best-effort: a cobrança JÁ existe e é pagável. Se o QR não vier,
      // devolvemos mesmo assim — a fatura hospedada (invoice_url) mostra o
      // PIX. Derrubar aqui deixaria o comprador sem forma de pagar algo que
      // já foi cobrado.
      let pixData: Record<string, unknown> | null = null;
      try {
        const pix = await getPixQrCode(charge.id);
        pixData = {
          // Prefixo data: montado aqui para o <img> do frontend usar direto.
          qr_code_image: pix.encodedImage ? `data:image/png;base64,${pix.encodedImage}` : null,
          payload: pix.payload,
          expiration_date: pix.expirationDate ?? null,
        };
      } catch (e) {
        console.error("[asaas-checkout] QR Code do PIX indisponível:", (e as Error).message);
      }
      return json({ ...base, pix: pixData });
    }

    if (billing_type === "BOLETO") {
      // Linha digitável é best-effort: o boleto pode levar alguns segundos
      // para ser registrado. Sem ela o usuário ainda tem o bankSlipUrl.
      let identificationField: string | null = null;
      try {
        const ident = await getBoletoIdentification(charge.id);
        identificationField = ident.identificationField ?? null;
      } catch (e) {
        console.warn("[asaas-checkout] linha digitável ainda indisponível:", (e as Error).message);
      }
      return json({
        ...base,
        boleto: {
          bank_slip_url: charge.bankSlipUrl ?? charge.invoiceUrl ?? null,
          identification_field: identificationField,
        },
      });
    }

    // CREDIT_CARD: o cartão é digitado na fatura hospedada pelo Asaas.
    // Dados de cartão NUNCA passam pelo nosso frontend/servidor — é o que
    // mantém o Guardião fora do escopo PCI-DSS SAQ-D.
    return json({
      ...base,
      credit_card: { invoice_url: charge.invoiceUrl ?? null },
    });
  } catch (err) {
    // Fase 5 (item 4): se a reserva foi feita mas a cobrança não nasceu,
    // libera a vaga ANTES de qualquer outra coisa — senão fica presa até
    // expirar. Mesma condição !chargeCreated do cancelamento da inscrição
    // logo abaixo: cobrança emitida = reserva legitimamente held até o
    // pagamento ou a expiração natural.
    if (createdRegistrationId && reservationHeld && !chargeCreated) {
      const { error: releaseErr } = await supabaseAdmin.rpc("release_ticket_reservation", {
        p_registration_id: createdRegistrationId,
      });
      if (releaseErr) {
        console.error("[asaas-checkout] falha ao liberar reserva após erro na cobrança", releaseErr);
      }
    }

    // Cobrança não nasceu: a inscrição pendente órfã é cancelada para não
    // ficar ocupando a listagem do organizador. Se a cobrança JÁ existe no
    // Asaas, a inscrição fica pendente de propósito — o webhook a confirma
    // quando o pagamento entrar.
    if (createdRegistrationId && !chargeCreated) {
      const { error: cancelErr } = await supabaseAdmin
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", createdRegistrationId)
        .eq("status", "pending");
      if (cancelErr) {
        console.error("[asaas-checkout] falha ao cancelar inscrição órfã", cancelErr);
      }
    }

    // Mesma condição do cancelamento acima: o uso do cupom só volta se a
    // cobrança NÃO nasceu. Com cobrança emitida a compra segue viva e o
    // cupom continua legitimamente consumido — quem devolve, nesse caso, é
    // o estorno ou o vencimento, nos webhooks.
    await releaseCouponIfConsumed();

    if (err instanceof AsaasError) {
      console.error("[asaas-checkout] erro do Asaas:", err.status, err.code, err.message);
      // 4xx do Asaas costuma ser problema do dado enviado (CPF, valor):
      // devolve a descrição dele, que já vem em português.
      const status = err.status >= 400 && err.status < 500 ? 400 : 502;
      return json({ error: "asaas_error", message: err.message }, status);
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[asaas-checkout] erro não tratado:", message, err);
    return json({ error: `Erro ao iniciar o pagamento: ${message}` }, 500);
  }
});
