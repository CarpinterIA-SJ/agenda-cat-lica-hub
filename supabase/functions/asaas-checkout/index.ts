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
  AsaasError,
  asaasDueDate,
  createPayment,
  findOrCreateCustomer,
  getBoletoIdentification,
  getPixQrCode,
  isAsaasConfigured,
  isValidCpfCnpj,
  onlyDigits,
  type AsaasBillingType,
} from "../_shared/asaas.ts";

const checkoutSchema = z.object({
  event_id:     z.string().uuid({ message: "event_id deve ser um uuid válido" }),
  ticket_id:    z.string().uuid({ message: "ticket_id deve ser um uuid válido" }),
  quantity:     z.number().int().min(1).max(10),
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
      event_id, ticket_id, quantity, user_id, billing_type,
      cpf, phone, coupon_code, custom_fields,
    } = parsed.data;

    console.log("[asaas-checkout] início:", JSON.stringify({
      event_id, ticket_id, quantity, billing_type, has_coupon: !!coupon_code,
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

    // 5) Ingresso.
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("event_tickets")
      .select("id, name, price_cents, event_id")
      .eq("id", ticket_id)
      .maybeSingle();
    if (ticketErr) {
      console.error("[asaas-checkout] erro ao buscar ingresso:", ticketErr);
      return json({ error: `Falha ao buscar o ingresso: ${ticketErr.message}` }, 500);
    }
    if (!ticket) {
      return json({ error: "Ingresso não encontrado. Verifique se o ingresso ainda está disponível." }, 404);
    }
    if (ticket.event_id !== event_id) {
      return json({ error: "Este ingresso não pertence ao evento informado." }, 400);
    }

    // Prazo configurado pelo organizador (migration 010, coluna opcional).
    let deadlineMin: number | null = null;
    {
      const { data: deadlineRow, error: deadlineErr } = await supabaseAdmin
        .from("event_tickets")
        .select("payment_deadline_minutes")
        .eq("id", ticket_id)
        .maybeSingle();
      if (deadlineErr) {
        console.warn("[asaas-checkout] payment_deadline_minutes indisponível:", deadlineErr.message);
      } else {
        deadlineMin = (deadlineRow as any)?.payment_deadline_minutes ?? null;
      }
    }

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

    let subtotal = ticket.price_cents * quantity;

    if (coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("discount_kind, discount_value, active, max_uses, used_count")
        .eq("event_id", event_id)
        .eq("code", coupon_code.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (coupon && (coupon.max_uses == null || coupon.used_count < coupon.max_uses)) {
        if (coupon.discount_kind === "percent") {
          subtotal = Math.max(0, Math.round(subtotal - subtotal * (Number(coupon.discount_value) / 100)));
        } else {
          subtotal = Math.max(0, subtotal - Math.round(Number(coupon.discount_value) * 100));
        }
      }
    }

    const taxa = Math.round(subtotal * (taxaPercent / 100));
    const total = subtotal + taxa;

    if (total < 1) return json({ error: "Valor total inválido para cobrança." }, 400);

    const minCents = MIN_CHARGE_CENTS[billing_type];
    if (total < minCents) {
      return json({
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
            return json({ error: `A opção "${s.option_label}" esgotou. Volte ao formulário e escolha outra.` }, 409);
          }
        }
      }
    }

    // 8) Organização dona do evento (obrigatória em payments).
    const { data: event, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("organization_id, name")
      .eq("id", event_id)
      .maybeSingle();
    if (eventErr || !event) {
      return json({ error: "Evento não encontrado." }, 404);
    }

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

    // 10) Inscrição PENDING criada ANTES da cobrança.
    // Ordem deliberada: o Asaas só aceita `externalReference` (uma string,
    // sem mapa de metadata como o Stripe), então precisamos do id da
    // inscrição já existindo para amarrá-lo à cobrança. Se o Asaas falhar
    // depois disso, o catch cancela esta inscrição.
    const { data: registration, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id,
        ticket_id,
        user_id,
        full_name: fullName,
        email: email || "sem-email@guardiaoeventos.com",
        cpf: onlyDigits(cpf),
        phone: phone ? onlyDigits(phone) : null,
        status: "pending",
        custom_fields: custom_fields ?? {},
      })
      .select("id")
      .single();
    if (regErr || !registration) {
      console.error("[asaas-checkout] falha ao criar inscrição pendente", regErr);
      return json({ error: "Não foi possível iniciar sua inscrição. Tente novamente." }, 500);
    }
    createdRegistrationId = registration.id;

    // 11) Cliente no Asaas (reaproveitado por CPF/CNPJ).
    const customer = await findOrCreateCustomer({
      name: fullName,
      cpfCnpj: cpf,
      email: email || undefined,
      mobilePhone: phone ?? undefined,
      externalReference: user_id,
    });

    // 12) Cobrança.
    const dueDays = deadlineMin && deadlineMin > 0
      ? Math.min(Math.max(Math.ceil(deadlineMin / 1440), 1), 60)
      : DEFAULT_DUE_DAYS[billing_type];

    const charge = await createPayment({
      customer: customer.id,
      billingType: billing_type,
      valueCents: total,
      dueDate: asaasDueDate(dueDays),
      description: `${ticket.name} — ${event.name}`.slice(0, 500),
      externalReference: registration.id,
    });
    chargeCreated = true;

    // 13) Amarra a cobrança à inscrição (coluna neutra da migration 027).
    const { error: linkErr } = await supabaseAdmin
      .from("event_registrations")
      .update({ gateway_charge_id: charge.id })
      .eq("id", registration.id);
    if (linkErr) {
      // Sem esse vínculo o webhook não acha a inscrição — falha dura.
      console.error("[asaas-checkout] falha ao vincular gateway_charge_id", linkErr);
      throw new Error("Não foi possível vincular a cobrança à inscrição.");
    }

    // 14) Pagamento PENDING.
    // O Asaas não carrega metadata arbitrária, então o que o webhook vai
    // precisar (quantidade, taxa, ingresso) fica aqui — gateway_payload é
    // jsonb e existe exatamente para dados específicos do gateway.
    // UNIQUE(gateway_transaction_id) torna este insert idempotente.
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
      gateway_payload: {
        quantity,
        ticket_id,
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
      // alto, porque sem esta linha o webhook perde quantity/fee.
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
      ticket_name: ticket.name,
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
