// ============================================================
//  Edge Function: reconcile-payments
//  Reconciliação de pagamentos cujo webhook nunca chegou.
//
//  Busca event_registrations 'pending' com mais de 2h e consulta a
//  cobrança correspondente direto na API do gateway que a originou.
//
//  STRIPE (payment_intent_id) — comportamento original, inalterado:
//   - succeeded  → materializa como o handler do webhook (idempotente)
//   - canceled   → marca a inscrição como 'cancelled'
//   - processing / requires_* → deixa pendente (cliente ainda pode pagar)
//
//  ASAAS (gateway_charge_id) — adicionado depois de o teste de sandbox
//  provar o buraco: a fila de webhooks do Asaas pode ficar pausada (após
//  15 falhas consecutivas ele PARA a fila inteira), e sem rede de
//  segurança a inscrição fica 'pending' para sempre segurando a vaga.
//   - RECEIVED / CONFIRMED / RECEIVED_IN_CASH / DUNNING_RECEIVED
//                → materializa como o handlePaid do asaas-webhook
//   - OVERDUE / DELETED / REFUNDED / 404 (cobrança sumiu)
//                → cancela como o handleUnpaid do asaas-webhook
//   - PENDING / AWAITING_RISK_ANALYSIS / refund/chargeback em curso
//                → deixa pendente
//
//  ─── SCAN 2: estorno de venda JÁ CONFIRMADA (?scan=refunds) ───
//  O scan acima só olha inscrições 'pending'. Se o PAYMENT_REFUNDED
//  (Asaas) / charge.refunded (Stripe) de uma venda JÁ CONFIRMADA nunca
//  for entregue, não havia rede nenhuma: a venda ficava válida para
//  sempre mesmo com o dinheiro devolvido de verdade no gateway.
//  O scan de estornos varre payments 'paid' recentes, pergunta ao
//  gateway se o estorno FOI EFETIVADO e, se foi, aplica exatamente a
//  mesma reversão dos webhooks (ver revertRefundedSale).
//
//  Modo de execução (query `?scan=` ou campo `scan` do body JSON):
//    'pending' (DEFAULT) → só o scan original. É o que a migration 024
//                          dispara com body '{}', portanto o cron de
//                          hora em hora segue idêntico.
//    'refunds'           → só o scan de estornos (cron diário, 028).
//    'all'               → os dois.
//
//  Crons: 'reconcile-payments-hourly' (migration 024, scan=pending) e
//  'reconcile-refunds-daily' (migration 028, scan=refunds). Usa
//  service_role, lida do Vault em ambos os casos.
//
//  ─── ACIONAMENTO RESTRITO A service_role ───
//  verify_jwt=true sozinho NÃO protegia nada de útil: ele aceita a anon
//  key, que é pública (vai no bundle do frontend), então qualquer um
//  podia disparar a varredura em loop e queimar chamadas de API do
//  Stripe e do Asaas. O portão está em isServiceRoleCaller(), antes de
//  qualquer consulta ou chamada a gateway. Ver a doc daquela função.
// ============================================================
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeadersFor, preflightResponse } from "../_shared/cors.ts";
import { buildLimitedSelections } from "../_shared/option-counts.ts";
import { AsaasError, asaasRequest, isAsaasConfigured } from "../_shared/asaas.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Inscrições pendentes mais antigas que isto são candidatas à reconciliação.
const STALE_HOURS = 2;

/**
 * Janela do scan de estornos: só vendas pagas nos últimos N dias são
 * reconsultadas no gateway.
 *
 * 90 dias, não 30: o prazo do Banco Central para devolução de Pix é de
 * 90 dias, e Pix é o meio dominante aqui. Uma janela de 30 dias deixaria
 * de fora um estorno legítimo feito no dia 45 — exatamente o buraco que
 * este scan existe para tapar. Acima de 90 dias o retorno cai a quase
 * zero (a cobrança já liquidou em definitivo) e o custo de API cresce
 * linearmente para sempre, então é aqui que a linha é traçada.
 * Chargeback de cartão vai além disso, mas chega como `charge.dispute.*`
 * — evento que os webhooks não tratam hoje, então não é escopo deste scan.
 */
const REFUND_SCAN_DAYS = Number(Deno.env.get("REFUND_SCAN_DAYS") ?? "90");

/**
 * Teto de cobranças reconsultadas por execução. Cada uma custa 1 chamada
 * de API ao gateway, então este número é o custo máximo por rodada.
 * 300/dia é folgado para o volume atual e barato nos dois gateways.
 * Ordenamos por paid_at DESC: se algum dia o teto passar a morder, quem
 * fica de fora é a venda mais antiga (a menos provável de estornar), e o
 * log emite aviso explícito em vez de degradar em silêncio.
 */
const REFUND_SCAN_LIMIT = Number(Deno.env.get("REFUND_SCAN_LIMIT") ?? "300");

/**
 * Comparação em tempo constante — não vaza o segredo por timing.
 * Espelha `safeEqual` do asaas-webhook. Copiada em vez de importada de
 * _shared de propósito: mover a função para lá obrigaria a editar um
 * arquivo que os webhooks importam, e eles são intocáveis aqui.
 */
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

/**
 * Lê a claim `role` de um JWT SEM validar assinatura — de propósito.
 *
 * Validar aqui seria redundante e pior: com verify_jwt=true (o default,
 * e o que vale para esta função) a plataforma JÁ rejeitou na borda todo
 * token que não esteja assinado com o JWT secret do projeto. O que chega
 * aqui é comprovadamente um token legítimo DESTE projeto; o que ainda
 * falta saber é QUAL é o portador, e isso é exatamente a claim `role`.
 */
function jwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    return (JSON.parse(payload) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

/**
 * Portão de entrada: só service_role aciona esta função.
 *
 * POR QUE NÃO BASTA verify_jwt=true: ele só exige um JWT *válido do
 * projeto* — e a anon key é exatamente isso, além de ser pública (vai no
 * bundle do frontend). Qualquer visitante do site podia disparar a
 * varredura em loop e queimar chamadas de API do Stripe e do Asaas,
 * gerando custo e risco de rate-limit externo nos dois gateways.
 *
 * Aceita duas formas, para o cron não quebrar em nenhuma hipótese:
 *   (a) igualdade exata com a service_role do ambiente da função;
 *   (b) qualquer JWT do projeto cuja claim role seja 'service_role'.
 * O caminho (b) cobre o caso de o segredo do Vault ser uma chave
 * service_role diferente da que está no env (ex.: rotação feita só de um
 * lado); o (a) cobre chave service_role em formato não-JWT (sb_secret_).
 * Ambos rejeitam anon e authenticated, que é o objetivo.
 */
function isServiceRoleCaller(req: Request): boolean {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  if (SUPABASE_SERVICE_ROLE_KEY && safeEqual(token, SUPABASE_SERVICE_ROLE_KEY)) return true;
  return jwtRole(token) === "service_role";
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const methodMap: Record<string, string> = {
  card: "credit_card",
  pix: "pix",
  boleto: "boleto",
};

// ─── Status do Asaas ────────────────────────────────────────
// Nomenclatura idêntica à dos eventos de webhook, sem o prefixo PAYMENT_.

/** Cobrança liquidada — equivale a PAYMENT_CONFIRMED/PAYMENT_RECEIVED. */
const ASAAS_PAID_STATUSES = new Set([
  "RECEIVED",
  "CONFIRMED",
  "RECEIVED_IN_CASH",
  "DUNNING_RECEIVED",
]);

/**
 * Cobrança que morreu sem virar inscrição válida — equivale a
 * PAYMENT_OVERDUE/PAYMENT_DELETED.
 *
 * REFUNDED entra aqui por uma razão específica: esta inscrição está
 * 'pending', ou seja, NUNCA foi confirmada. O handleRefunded do webhook
 * exigiria payments.status='paid' para reverter e, num pagamento que
 * ficou pendente, ele não faria nada — deixando a inscrição presa, que é
 * exatamente o buraco que esta função existe para tapar. Cancelar é o
 * desfecho correto: o dinheiro voltou e nada foi contabilizado (sold e
 * option_counts só sobem na confirmação), então não há o que decrementar.
 *
 * Estornos/chargebacks EM CURSO (REFUND_REQUESTED, CHARGEBACK_*) NÃO
 * entram: são estados transitórios que ainda podem resolver a favor da
 * venda. Ficam pendentes até virarem terminais.
 */
const ASAAS_DEAD_STATUSES = new Set([
  "OVERDUE",
  "DELETED",
  "REFUNDED",
]);

interface AsaasPaymentStatus {
  id: string;
  status: string;
  externalReference?: string | null;
}

/** Inscrição pendente candidata à reconciliação. */
interface StaleRegistration {
  id: string;
  event_id: string;
  ticket_id: string;
  user_id: string | null;
  payment_intent_id: string | null;
  gateway_charge_id: string | null;
  custom_fields?: unknown;
  registered_at?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return preflightResponse(req);
  }

  const cors = corsHeadersFor(req);

  // Portão ANTES de qualquer trabalho: nenhuma consulta ao banco e, o que
  // importa, nenhuma chamada paga aos gateways acontece para quem não é
  // service_role. 401 genérico — não conta ao chamador o que faltou.
  if (!isServiceRoleCaller(req)) {
    console.warn("[reconcile-payments] acionamento recusado: chamador não é service_role");
    return json({ error: "Não autorizado." }, 401, cors);
  }

  // Default 'pending' = comportamento histórico. A migration 024 manda
  // body '{}', que cai exatamente aqui.
  const mode = await resolveScanMode(req);
  const runPending = mode === "pending" || mode === "all";
  const runRefunds = mode === "refunds" || mode === "all";

  const missingEnv: string[] = [];
  if (!STRIPE_SECRET_KEY) missingEnv.push("STRIPE_SECRET_KEY");
  if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missingEnv.length) {
    console.error("[reconcile-payments] env ausente:", missingEnv.join(", "));
    return json({ error: `Configuração incompleta: ${missingEnv.join(", ")}` }, 500, cors);
  }

  // ASAAS_API_KEY NÃO entra no missingEnv acima de propósito: derrubar a
  // função inteira por causa do Asaas tiraria do ar a reconciliação do
  // Stripe, que já funciona. Sem a chave, só o ramo Asaas é pulado.
  const asaasReady = isAsaasConfigured();
  if (!asaasReady) {
    console.warn("[reconcile-payments] ASAAS_API_KEY ausente — ramo Asaas será pulado");
  }

  // Contadores planos = totais dos dois gateways (mantêm o formato antigo
  // da resposta); by_gateway abre o detalhe.
  const stats = {
    scanned: 0,
    reconciled_succeeded: 0,
    reconciled_cancelled: 0,
    left_pending: 0,
    skipped_no_intent: 0,
    errors: 0,
    by_gateway: {
      stripe: { scanned: 0, succeeded: 0, cancelled: 0, left_pending: 0, errors: 0 },
      asaas: {
        scanned: 0,
        succeeded: 0,
        cancelled: 0,
        left_pending: 0,
        errors: 0,
        skipped_not_configured: 0,
      },
    },
  };

  try {
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

    // Inscrições presas em 'pending' há mais de STALE_HOURS.
    // NB: a coluna de criação em event_registrations é `registered_at`
    // (não `created_at`) — usar o nome errado fazia a query falhar (400).
    let stale: StaleRegistration[] = [];
    if (runPending) {
      const { data, error: staleErr } = await supabaseAdmin
        .from("event_registrations")
        .select(
          "id, event_id, ticket_id, user_id, payment_intent_id, gateway_charge_id, custom_fields, registered_at",
        )
        .eq("status", "pending")
        .lt("registered_at", cutoff)
        .order("registered_at", { ascending: true })
        .limit(200);
      if (staleErr) throw staleErr;
      stale = (data ?? []) as StaleRegistration[];
    }

    stats.scanned = stale.length;

    for (const reg of stale) {
      try {
        const gateway = await resolveGateway(reg);

        if (gateway === "asaas") {
          stats.by_gateway.asaas.scanned++;
          if (!asaasReady) {
            stats.by_gateway.asaas.skipped_not_configured++;
            continue;
          }
          const outcome = await reconcileAsaas(reg);
          if (outcome === "confirmed") {
            stats.reconciled_succeeded++;
            stats.by_gateway.asaas.succeeded++;
          } else if (outcome === "cancelled") {
            stats.reconciled_cancelled++;
            stats.by_gateway.asaas.cancelled++;
          } else {
            stats.left_pending++;
            stats.by_gateway.asaas.left_pending++;
          }
          continue;
        }

        if (gateway === "stripe") {
          stats.by_gateway.stripe.scanned++;
          // ─── Caminho Stripe: idêntico ao original ───
          const pi = await stripe.paymentIntents.retrieve(reg.payment_intent_id as string);

          if (pi.status === "succeeded") {
            await handleSucceeded(pi, reg);
            stats.reconciled_succeeded++;
            stats.by_gateway.stripe.succeeded++;
          } else if (pi.status === "canceled") {
            await markCancelled(reg.id);
            stats.reconciled_cancelled++;
            stats.by_gateway.stripe.cancelled++;
          } else {
            // processing | requires_payment_method | requires_action | requires_confirmation
            stats.left_pending++;
            stats.by_gateway.stripe.left_pending++;
          }
          continue;
        }

        // Sem referência de cobrança em nenhum dos dois gateways: inscrição
        // gratuita, ou checkout que morreu antes de amarrar a cobrança.
        stats.skipped_no_intent++;
      } catch (e) {
        stats.errors++;
        // Atribui o erro ao gateway certo para o log ficar acionável.
        if (reg.gateway_charge_id) stats.by_gateway.asaas.errors++;
        else if (reg.payment_intent_id) stats.by_gateway.stripe.errors++;
        console.error("[reconcile-payments] erro na inscrição", reg.id, (e as Error).message);
      }
    }

    const refundScan = runRefunds ? await runRefundScan(asaasReady) : null;
    const extra = refundScan ? { refund_scan: refundScan } : {};

    console.log(
      "[reconcile-payments] resultado:",
      JSON.stringify({ mode, cutoff, ...stats, ...extra }),
    );
    return json({ ok: true, mode, ...stats, ...extra }, 200, cors);
  } catch (err) {
    console.error("[reconcile-payments] erro não tratado:", (err as Error).message, err);
    return json({ error: (err as Error).message, ...stats }, 500, cors);
  }
});

// ─── Roteamento por gateway ─────────────────────────────────

/**
 * Decide a qual gateway a inscrição pendente pertence.
 *
 * Na prática as duas colunas são mutuamente exclusivas por construção:
 * `payment_intent_id` só é escrito pelo stripe-checkout e
 * `gateway_charge_id` só pelo asaas-checkout (migration 027). O caso de
 * ambas preenchidas não deveria existir; se existir, `payments.gateway` é
 * a autoridade — é a coluna que a própria 027 elegeu como discriminador —
 * e o empate cai para 'stripe' (o legado) com aviso no log.
 *
 * NÃO consultamos payments no caminho comum de propósito: no fluxo Stripe
 * a linha de payments só nasce na CONFIRMAÇÃO, então uma inscrição presa
 * em 'pending' normalmente não tem payments — consultar seria uma ida ao
 * banco inútil por registro.
 */
async function resolveGateway(reg: StaleRegistration): Promise<"stripe" | "asaas" | null> {
  const hasAsaas = !!reg.gateway_charge_id;
  const hasStripe = !!reg.payment_intent_id;

  if (hasAsaas && !hasStripe) return "asaas";
  if (hasStripe && !hasAsaas) return "stripe";
  if (!hasAsaas && !hasStripe) return null;

  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("gateway")
    .eq("registration_id", reg.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const gateway = pay?.gateway === "asaas" ? "asaas" : "stripe";
  console.warn(
    "[reconcile-payments] inscrição com referência dos DOIS gateways:",
    reg.id, "→ usando", gateway,
  );
  return gateway;
}

// ─── Asaas ──────────────────────────────────────────────────

type AsaasOutcome = "confirmed" | "cancelled" | "pending";

/**
 * Consulta a cobrança no Asaas e materializa o desfecho replicando o
 * asaas-webhook. Os guards atômicos são os mesmos de lá, então rodar isto
 * concorrentemente com uma entrega tardia do webhook é seguro: quem
 * transiciona a linha primeiro produz o efeito, o outro vira no-op.
 */
async function reconcileAsaas(reg: StaleRegistration): Promise<AsaasOutcome> {
  const chargeId = reg.gateway_charge_id as string;

  let charge: AsaasPaymentStatus;
  try {
    charge = await asaasRequest<AsaasPaymentStatus>(
      `/payments/${encodeURIComponent(chargeId)}`,
    );
  } catch (e) {
    // 404: a cobrança não existe mais no Asaas (removida). Mesmo desfecho
    // de PAYMENT_DELETED — a inscrição não pode ficar presa esperando uma
    // cobrança que sumiu.
    if (e instanceof AsaasError && e.status === 404) {
      console.warn("[reconcile-payments/asaas] cobrança inexistente (404):", chargeId);
      return await asaasMarkUnpaid(reg, chargeId, "NOT_FOUND");
    }
    throw e;
  }

  const status = (charge.status ?? "").toUpperCase();

  if (ASAAS_PAID_STATUSES.has(status)) {
    return await asaasMarkPaid(reg, chargeId, status);
  }

  if (ASAAS_DEAD_STATUSES.has(status)) {
    return await asaasMarkUnpaid(reg, chargeId, status);
  }

  console.log("[reconcile-payments/asaas] cobrança ainda pendente:", chargeId, status);
  return "pending";
}

/**
 * Espelha handlePaid do asaas-webhook: flip atômico de payments, promoção
 * da inscrição, increment_ticket_sold e tally_option_counts.
 */
async function asaasMarkPaid(
  reg: StaleRegistration,
  chargeId: string,
  status: string,
): Promise<AsaasOutcome> {
  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("id, status, event_id, registration_id, gateway_payload")
    .eq("gateway_transaction_id", chargeId)
    .maybeSingle();

  if (!pay) {
    // Mesma razão do webhook: sem quantity/fee em gateway_payload não dá
    // para materializar a venda com números corretos. Falha alto — o
    // registro fica para a próxima rodada e aparece no log de erros.
    throw new Error(`payments ausente para a cobrança ${chargeId}`);
  }

  // IDEMPOTÊNCIA (guard atômico): só quem transita pending → paid segue.
  // Se o webhook chegou primeiro (ou uma rodada anterior desta função),
  // encontra 'paid' → 0 linhas → não incrementa sold de novo.
  const { data: flipped } = await supabaseAdmin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", pay.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (!flipped) {
    // Pagamento já contabilizado por outro caminho: a única reparação
    // segura é alinhar a inscrição. Mesma decisão do ramo Stripe
    // (`if (existing) { ...update confirmed...; return; }`) — não mexer
    // em sold/option_counts, porque quem fez o flip já os moveu.
    const { data: fixed } = await supabaseAdmin
      .from("event_registrations")
      .update({ status: "confirmed" })
      .eq("id", reg.id)
      .neq("status", "confirmed")
      .select("id")
      .maybeSingle();
    if (fixed) {
      console.warn(
        "[reconcile-payments/asaas] payment já estava pago; inscrição realinhada:",
        reg.id, chargeId,
      );
      return "confirmed";
    }
    console.log("[reconcile-payments/asaas] já processado, nada a fazer:", chargeId);
    return "pending";
  }

  const gp = (pay.gateway_payload ?? {}) as Record<string, unknown>;
  const quantity = Math.max(1, Number(gp.quantity ?? 1));
  const eventId = (pay.event_id as string | null) ?? reg.event_id;

  // Promove a inscrição (guard por status: seguro de repetir).
  let regAnswers: unknown = reg.custom_fields ?? null;
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("event_registrations")
    .update({ status: "confirmed" })
    .eq("id", reg.id)
    .neq("status", "confirmed")
    .select("id, custom_fields")
    .maybeSingle();
  if (updErr) throw updErr;
  if (updated?.custom_fields != null) regAnswers = updated.custom_fields;

  // Incremento atômico de sold (RPC da migration 018).
  const ticketId = (gp.ticket_id as string) ?? reg.ticket_id ?? null;
  if (ticketId) {
    const { error: soldErr } = await supabaseAdmin.rpc("increment_ticket_sold", {
      p_ticket_id: ticketId,
      p_quantity: quantity,
    });
    if (soldErr) throw soldErr;
  } else {
    console.error("[reconcile-payments/asaas] sem ticket_id para incrementar sold:", chargeId);
  }

  // Vagas por opção (venda final, incondicional). Best-effort, igual ao
  // webhook: o pagamento já está registrado, não derruba a reconciliação.
  if (eventId) {
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("custom_fields")
      .eq("id", eventId)
      .maybeSingle();
    const selections = buildLimitedSelections((ev as any)?.custom_fields, regAnswers);
    if (selections.length) {
      const { error: optErr } = await supabaseAdmin.rpc("tally_option_counts", {
        p_event_id: eventId,
        p_selections: selections,
      });
      if (optErr) console.error("[reconcile-payments/asaas] tally_option_counts falhou", optErr);
    }
  }

  console.log("[reconcile-payments/asaas] confirmado:", chargeId, status, "→", reg.id);
  return "confirmed";
}

/**
 * Espelha handleUnpaid do asaas-webhook: cancela pagamento e inscrição,
 * SEM decrementar sold/option_counts (nunca foram incrementados, porque a
 * inscrição jamais chegou a 'confirmed') e com trilha em audit_logs.
 */
async function asaasMarkUnpaid(
  reg: StaleRegistration,
  chargeId: string,
  status: string,
): Promise<AsaasOutcome> {
  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("id, status, event_id, coupon_id")
    .eq("gateway_transaction_id", chargeId)
    .maybeSingle();

  // Fora de ordem: se o pagamento já está pago/estornado, este desfecho
  // não manda em nada. Desfazer uma venda boa seria muito pior.
  if (pay && (pay.status === "paid" || pay.status === "refunded")) {
    console.warn(
      "[reconcile-payments/asaas] status '%s' no Asaas, mas payment está '%s' — nada alterado:",
      status, pay.status, chargeId,
    );
    return "pending";
  }

  // IDEMPOTÊNCIA (guard atômico), mesmo padrão do webhook.
  let paymentChanged = false;
  if (pay) {
    const { data: flipped } = await supabaseAdmin
      .from("payments")
      .update({ status: "cancelled" })
      .eq("id", pay.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    paymentChanged = !!flipped;
  }

  const { data: flippedReg } = await supabaseAdmin
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("id", reg.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  const registrationChanged = !!flippedReg;

  if (!paymentChanged && !registrationChanged) {
    console.log("[reconcile-payments/asaas] cancelamento já processado:", chargeId);
    return "pending";
  }

  // Mesma action do webhook para a trilha ficar homogênea; `source`
  // distingue quem escreveu.
  // Cobrança morreu sem pagamento: o benefício do cupom nunca foi entregue,
  // então o uso volta. Protegido pelo guard acima (só chega aqui quem de fato
  // transicionou algo), então rodar concorrente com o webhook não devolve
  // duas vezes.
  if ((pay as any)?.coupon_id) {
    const { error: cupErr } = await supabaseAdmin.rpc("release_coupon_use", {
      p_coupon_id: (pay as any).coupon_id,
    });
    if (cupErr) console.error("[reconcile-payments/asaas] release_coupon_use falhou", cupErr);
  }

  const { error: auditErr } = await supabaseAdmin.from("audit_logs").insert({
    actor_email: "system@reconcile-payments",
    action: "CANCELAR_COBRANCA_NAO_PAGA",
    entity_type: "payment",
    entity_id: pay?.id ?? reg.id,
    details: {
      gateway: "asaas",
      source: "reconcile-payments",
      asaas_status: status,
      charge_id: chargeId,
      registration_id: reg.id,
      event_id: pay?.event_id ?? reg.event_id,
      payment_cancelled: paymentChanged,
      registration_cancelled: registrationChanged,
    },
  });
  if (auditErr) console.error("[reconcile-payments/asaas] audit_logs falhou", auditErr);

  console.log("[reconcile-payments/asaas] cancelado:", chargeId, status, "→", reg.id);
  return "cancelled";
}

// ─── Stripe (inalterado) ────────────────────────────────────

// Mesma materialização do webhook (idempotente via gateway_transaction_id).
async function handleSucceeded(
  pi: Stripe.PaymentIntent,
  reg: { id: string; event_id: string; ticket_id: string; user_id: string | null; custom_fields?: unknown },
) {
  const m = pi.metadata ?? {};
  const eventId = m.event_id || reg.event_id;
  const ticketId = m.ticket_id || reg.ticket_id;
  const quantity = Math.max(1, Number(m.quantity ?? "1"));
  const userId = m.user_id || reg.user_id || null;
  const feeCents = Number(m.fee_cents ?? "0");
  const amount = pi.amount;
  const netCents = amount - feeCents;

  if (!eventId || !ticketId) return;

  // Idempotência: pagamento já registrado → nada a fazer.
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("gateway_transaction_id", pi.id)
    .maybeSingle();
  if (existing) {
    // Garante que a inscrição reflita o pagamento já existente.
    await supabaseAdmin
      .from("event_registrations")
      .update({ status: "confirmed" })
      .eq("id", reg.id)
      .neq("status", "confirmed");
    return;
  }

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("organization_id, custom_fields")
    .eq("id", eventId)
    .single();
  if (!event) return;

  // Dados do comprador (mesma resolução do webhook).
  let fullName = "Participante";
  let email = pi.receipt_email ?? "";
  if (userId) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      email = email || authUser.user.email || "";
      fullName = (authUser.user.user_metadata?.full_name as string) || fullName;
    }
    const { data: profile } = await supabaseAdmin.from("profiles").select("name").eq("id", userId).maybeSingle();
    if (profile?.name) fullName = profile.name;
  }

  const { data: updated, error: updErr } = await supabaseAdmin
    .from("event_registrations")
    .update({ status: "confirmed", full_name: fullName, email: email || "sem-email@guardiaoeventos.com" })
    .eq("id", reg.id)
    .select("id")
    .single();
  if (updErr) throw updErr;

  const method = await resolveMethod(pi);
  const { error: payErr } = await supabaseAdmin.from("payments").insert({
    organization_id: event.organization_id,
    event_id: eventId,
    registration_id: updated.id,
    amount_cents: amount,
    fee_cents: feeCents,
    net_cents: netCents,
    currency: "BRL",
    method,
    status: "paid",
    gateway: "stripe",
    gateway_transaction_id: pi.id,
    paid_at: new Date().toISOString(),
  });
  if (payErr) throw payErr;

  // Incremento atômico de sold (RPC migration 018).
  const { error: soldErr } = await supabaseAdmin.rpc("increment_ticket_sold", {
    p_ticket_id: ticketId,
    p_quantity: quantity,
  });
  if (soldErr) throw soldErr;

  // Fase C: contabiliza vagas por opção (incondicional — venda final).
  // Mesma lógica do webhook; best-effort, não derruba a reconciliação.
  const selections = buildLimitedSelections((event as any).custom_fields, reg.custom_fields);
  if (selections.length) {
    const { error: optErr } = await supabaseAdmin.rpc("tally_option_counts", {
      p_event_id: eventId,
      p_selections: selections,
    });
    if (optErr) console.error("[reconcile-payments] tally_option_counts falhou", optErr);
  }
}

async function markCancelled(regId: string) {
  await supabaseAdmin
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("id", regId)
    .neq("status", "confirmed");
}

async function resolveMethod(pi: Stripe.PaymentIntent): Promise<string> {
  try {
    if (pi.latest_charge) {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string);
      const type = charge.payment_method_details?.type ?? "";
      return methodMap[type] ?? "credit_card";
    }
  } catch (_e) { /* ignore */ }
  return "credit_card";
}

// ═══════════════════════════════════════════════════════════
//  SCAN 2 — estornos de vendas já confirmadas
// ═══════════════════════════════════════════════════════════

type ScanMode = "pending" | "refunds" | "all";

/**
 * Lê o modo de `?scan=` ou do campo `scan` do body. Qualquer coisa
 * inesperada (body vazio, JSON inválido, valor desconhecido) cai em
 * 'pending' — o cron horário da 024 manda '{}' e precisa continuar
 * significando exatamente o que significava antes.
 */
async function resolveScanMode(req: Request): Promise<ScanMode> {
  const fromQuery = new URL(req.url).searchParams.get("scan");
  if (fromQuery) return normalizeScanMode(fromQuery);

  try {
    const body = await req.json();
    return normalizeScanMode((body as { scan?: unknown } | null)?.scan);
  } catch {
    return "pending";
  }
}

function normalizeScanMode(raw: unknown): ScanMode {
  const v = typeof raw === "string" ? raw.toLowerCase().trim() : "";
  if (v === "refunds") return "refunds";
  if (v === "all") return "all";
  return "pending";
}

interface RefundScanStats {
  scanned: number;
  reverted: number;
  unchanged: number;
  errors: number;
  skipped_unknown_gateway: number;
  skipped_not_configured: number;
  hit_limit: boolean;
  /**
   * Cobranças que o gateway não reconhece (404 / "No such payment_intent").
   * Contador próprio de propósito: somar em `unchanged` afirmaria que a
   * venda foi verificada e está boa, o que é mentira — ela não foi
   * verificada; e somar em `errors` faria ruído recorrente mascarar falha
   * real, porque a causa comum é permanente (linha de teste no banco de
   * produção, ou seja, id de outro modo/conta Stripe) e reaparece a cada
   * rodada até sair da janela.
   */
  not_found: number;
  by_gateway: {
    stripe: { scanned: number; reverted: number; unchanged: number; not_found: number; errors: number };
    asaas: { scanned: number; reverted: number; unchanged: number; not_found: number; errors: number };
  };
  /**
   * Primeiras falhas com a mensagem do gateway junto. Um contador sozinho
   * não é acionável: `errors: 3` obriga a ir atrás do log para descobrir se
   * é chave errada, id inexistente ou gateway fora do ar. Limitado a
   * ERROR_SAMPLE_CAP para a resposta não virar despejo de log.
   */
  error_samples: Array<{ gateway: string; id: string; message: string }>;
}

/** Teto de amostras de erro anexadas ao relatório. */
const ERROR_SAMPLE_CAP = 5;

/**
 * Desfecho da verificação de UMA venda paga.
 *   'reverted'   → gateway confirmou estorno efetivado e a venda foi desfeita
 *   'unchanged'  → verificada, sem estorno (ou estorno só pedido/cancelado)
 *   'not_found'  → o gateway não reconhece a cobrança; NÃO foi verificada
 */
type RefundOutcome = "reverted" | "unchanged" | "not_found";

/** Cobrança paga candidata à verificação de estorno. */
interface PaidPayment {
  id: string;
  event_id: string | null;
  registration_id: string | null;
  gateway: string | null;
  gateway_transaction_id: string;
  paid_at: string | null;
  gateway_payload: unknown;
  coupon_id: string | null;
}

/** Inscrição vinculada ao pagamento estornado. */
interface RefundRegistration {
  id: string;
  status: string;
  ticket_id: string | null;
  custom_fields?: unknown;
}

/**
 * Varre pagamentos 'paid' recentes e pergunta ao gateway se viraram
 * estorno EFETIVADO sem o webhook ter avisado.
 *
 * Só olha payments.status='paid' porque é exatamente a linha que a
 * reversão precisa transicionar — o mesmo guard que os webhooks usam.
 * Uma venda já revertida está em 'refunded' e nem aparece na varredura.
 */
async function runRefundScan(asaasReady: boolean): Promise<RefundScanStats> {
  const stats: RefundScanStats = {
    scanned: 0,
    reverted: 0,
    unchanged: 0,
    errors: 0,
    skipped_unknown_gateway: 0,
    skipped_not_configured: 0,
    hit_limit: false,
    not_found: 0,
    by_gateway: {
      stripe: { scanned: 0, reverted: 0, unchanged: 0, not_found: 0, errors: 0 },
      asaas: { scanned: 0, reverted: 0, unchanged: 0, not_found: 0, errors: 0 },
    },
    error_samples: [],
  };

  const cutoff = new Date(Date.now() - REFUND_SCAN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // paid_at nulo fica de fora de propósito: sem data de pagamento não há
  // como aplicar a janela, e varrer essas linhas para sempre é o custo
  // ilimitado que a janela existe para evitar.
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select("id, event_id, registration_id, gateway, gateway_transaction_id, paid_at, gateway_payload, coupon_id")
    .eq("status", "paid")
    .not("gateway_transaction_id", "is", null)
    .gte("paid_at", cutoff)
    .order("paid_at", { ascending: false })
    .limit(REFUND_SCAN_LIMIT);
  if (error) throw error;

  const rows = (data ?? []) as PaidPayment[];
  stats.scanned = rows.length;

  if (rows.length >= REFUND_SCAN_LIMIT) {
    stats.hit_limit = true;
    console.warn(
      "[reconcile-payments/refunds] teto de %d atingido — vendas mais antigas que %s não foram verificadas nesta rodada",
      REFUND_SCAN_LIMIT,
      rows[rows.length - 1]?.paid_at,
    );
  }

  for (const pay of rows) {
    const gateway = resolvePaymentGateway(pay);
    if (!gateway) {
      stats.skipped_unknown_gateway++;
      console.warn("[reconcile-payments/refunds] gateway indeterminado:", pay.id);
      continue;
    }

    if (gateway === "asaas" && !asaasReady) {
      stats.skipped_not_configured++;
      continue;
    }

    stats.by_gateway[gateway].scanned++;

    try {
      const outcome = gateway === "asaas"
        ? await refundScanAsaas(pay)
        : await refundScanStripe(pay);

      if (outcome === "reverted") {
        stats.reverted++;
        stats.by_gateway[gateway].reverted++;
      } else if (outcome === "not_found") {
        stats.not_found++;
        stats.by_gateway[gateway].not_found++;
      } else {
        stats.unchanged++;
        stats.by_gateway[gateway].unchanged++;
      }
    } catch (e) {
      stats.errors++;
      stats.by_gateway[gateway].errors++;
      const message = (e as Error).message;
      if (stats.error_samples.length < ERROR_SAMPLE_CAP) {
        stats.error_samples.push({ gateway, id: pay.gateway_transaction_id, message });
      }
      console.error("[reconcile-payments/refunds] erro em", pay.gateway_transaction_id, message);
    }
  }

  return stats;
}

/**
 * Descobre o gateway da linha de payments. `gateway` é a autoridade (foi
 * a coluna eleita discriminadora pela migration 027); o prefixo do id só
 * entra como resgate para linhas legadas que ficaram sem o campo.
 */
function resolvePaymentGateway(pay: PaidPayment): "stripe" | "asaas" | null {
  const g = (pay.gateway ?? "").toLowerCase();
  if (g === "asaas") return "asaas";
  if (g === "stripe") return "stripe";

  const id = pay.gateway_transaction_id ?? "";
  if (id.startsWith("pay_")) return "asaas";
  if (id.startsWith("pi_")) return "stripe";
  return null;
}

// ─── Asaas ──────────────────────────────────────────────────

interface AsaasPaymentDetail {
  id: string;
  status: string;
  value?: number | null;
}

/**
 * Estorno efetivado no Asaas == `payment.status === 'REFUNDED'`.
 *
 * Basta 1 chamada, e é a leitura CERTA — não a lista /refunds. O teste
 * de sandbox de 05/08 (cobrança pay_coovtdlt0eeajebt) mostrou o porquê:
 * havia uma entrada em /refunds com status 'CANCELLED' enquanto a
 * cobrança seguia 'RECEIVED'. Quem olhasse só a existência de um item em
 * refunds[] teria revertido uma venda que nunca foi estornada. O status
 * da cobrança é o único campo que distingue estorno concluído de estorno
 * pedido, em curso ou cancelado.
 *
 * PARTIALLY_REFUNDED fica de fora de propósito: é o mesmo recorte do
 * handleRefunded dos dois webhooks, que ignoram estorno parcial em vez
 * de cancelar a inscrição inteira e liberar a vaga.
 */
async function refundScanAsaas(pay: PaidPayment): Promise<RefundOutcome> {
  const chargeId = pay.gateway_transaction_id;

  let charge: AsaasPaymentDetail;
  try {
    charge = await asaasRequest<AsaasPaymentDetail>(
      `/payments/${encodeURIComponent(chargeId)}`,
    );
  } catch (e) {
    // 404 aqui NÃO vira reversão: sumiço de cobrança não é prova de
    // devolução do dinheiro, e desfazer uma venda boa é pior que deixar
    // o alarme tocando. Só registra.
    if (e instanceof AsaasError && e.status === 404) {
      console.warn("[reconcile-payments/refunds] cobrança inexistente (404):", chargeId);
      return "not_found";
    }
    throw e;
  }

  const status = (charge.status ?? "").toUpperCase();
  if (status !== "REFUNDED") return "unchanged";

  const gp = (pay.gateway_payload ?? {}) as Record<string, unknown>;
  const quantity = Math.max(1, Number(gp.quantity ?? 1));

  return await revertRefundedSale({
    pay,
    gateway: "asaas",
    quantity,
    findRegistration: () =>
      supabaseAdmin
        .from("event_registrations")
        .select("id, status, ticket_id, custom_fields")
        .eq("gateway_charge_id", chargeId)
        .maybeSingle(),
    fallbackTicketId: (gp.ticket_id as string) ?? null,
    fallbackEventId: null,
    auditDetails: { gateway: "asaas", charge_id: chargeId, asaas_status: status },
  });
}

// ─── Stripe ─────────────────────────────────────────────────

/**
 * Estorno efetivado no Stripe: mesmo predicado do handleRefunded do
 * stripe-webhook — `charge.refunded === true` E o valor estornado
 * cobrindo o valor total. Parcial não reverte, igual ao webhook.
 *
 * `expand: ['latest_charge']` traz a charge junto do PaymentIntent e
 * mantém o custo em 1 chamada por venda.
 */
async function refundScanStripe(pay: PaidPayment): Promise<RefundOutcome> {
  const piId = pay.gateway_transaction_id;

  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
  } catch (e) {
    // Mesma decisão do 404 do Asaas, pelo mesmo motivo: a Stripe não
    // reconhecer o PaymentIntent não é prova de que o dinheiro voltou.
    //
    // A causa observada em 07/08/2026 é permanente: linhas de payments
    // criadas em modo TESTE ficaram no banco de produção, e a chave live
    // da função não enxerga id de teste ("No such payment_intent"). Sem
    // este ramo, essas linhas queimariam 1 chamada e 1 erro por dia até
    // vencerem a janela de 90 dias, escondendo falha real no meio.
    if (e instanceof Stripe.errors.StripeInvalidRequestError && e.code === "resource_missing") {
      console.warn("[reconcile-payments/refunds] payment_intent inexistente:", piId, e.message);
      return "not_found";
    }
    throw e;
  }

  const charge = pi.latest_charge as Stripe.Charge | null;
  if (!charge || typeof charge === "string") return "unchanged";

  if (charge.refunded !== true || (charge.amount_refunded ?? 0) < (charge.amount ?? 0)) {
    return "unchanged";
  }

  const m = pi.metadata ?? {};
  const quantity = Math.max(1, Number(m.quantity ?? "1"));

  return await revertRefundedSale({
    pay,
    gateway: "stripe",
    quantity,
    findRegistration: () =>
      supabaseAdmin
        .from("event_registrations")
        .select("id, status, ticket_id, custom_fields")
        .eq("payment_intent_id", piId)
        .maybeSingle(),
    fallbackTicketId: m.ticket_id ?? null,
    fallbackEventId: m.event_id ?? null,
    auditDetails: {
      gateway: "stripe",
      payment_intent_id: piId,
      amount_refunded: charge.amount_refunded ?? null,
    },
  });
}

// ─── Reversão (espelha handleRefunded dos dois webhooks) ────

/**
 * Aplica a reversão de uma venda estornada. É deliberadamente a MESMA
 * sequência do handleRefunded do stripe-webhook e do asaas-webhook:
 *
 *   1. flip atômico payments paid → refunded (+ refunded_at)
 *   2. inscrição → 'cancelled'
 *   3. se estava 'confirmed': decrement_ticket_sold + release_option_counts
 *   4. audit_logs 'ESTORNAR_PAGAMENTO'
 *
 * IDEMPOTÊNCIA: o passo 1 é o guard. `.eq('status','paid')` faz o UPDATE
 * casar 0 linhas se o webhook (ou uma rodada anterior deste scan) já
 * reverteu, e aí a função sai antes de decrementar sold/option_counts.
 * Rodar isto em paralelo com uma entrega tardia do webhook é seguro:
 * quem transiciona a linha primeiro produz o efeito, o outro é no-op.
 *
 * O status da inscrição é lido DEPOIS do flip e antes do cancelamento,
 * porque só quem estava 'confirmed' chegou a somar sold/option_counts —
 * decrementar uma venda que nunca foi contada zeraria vaga alheia.
 */
async function revertRefundedSale(params: {
  pay: PaidPayment;
  gateway: "stripe" | "asaas";
  quantity: number;
  findRegistration: () => PromiseLike<{ data: RefundRegistration | null }>;
  fallbackTicketId: string | null;
  fallbackEventId: string | null;
  auditDetails: Record<string, unknown>;
}): Promise<RefundOutcome> {
  const { pay, gateway, quantity, findRegistration } = params;

  // (1) Guard atômico — idêntico ao dos webhooks.
  const { data: flipped } = await supabaseAdmin
    .from("payments")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", pay.id)
    .eq("status", "paid")
    .select("id")
    .maybeSingle();
  if (!flipped) {
    console.log("[reconcile-payments/refunds] estorno já processado:", pay.gateway_transaction_id);
    return "unchanged";
  }

  const eventId = pay.event_id ?? params.fallbackEventId;

  // (2) Inscrição: captura o status ANTES de cancelar.
  const { data: reg } = await findRegistration();
  const wasConfirmed = reg?.status === "confirmed";
  const ticketId = reg?.ticket_id ?? params.fallbackTicketId;

  if (reg && reg.status !== "cancelled") {
    await supabaseAdmin
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", reg.id);
  }

  // (3) Libera vaga e opções — só se a venda chegou a ser contabilizada.
  if (wasConfirmed) {
    if (ticketId) {
      const { error: decErr } = await supabaseAdmin.rpc("decrement_ticket_sold", {
        p_ticket_id: ticketId,
        p_quantity: quantity,
      });
      if (decErr) console.error("[reconcile-payments/refunds] decrement_ticket_sold falhou", decErr);
    }
    if (eventId) {
      const { data: ev } = await supabaseAdmin
        .from("events")
        .select("custom_fields")
        .eq("id", eventId)
        .maybeSingle();
      const selections = buildLimitedSelections((ev as any)?.custom_fields, reg?.custom_fields);
      if (selections.length) {
        const { error: relErr } = await supabaseAdmin.rpc("release_option_counts", {
          p_event_id: eventId,
          p_selections: selections,
        });
        if (relErr) console.error("[reconcile-payments/refunds] release_option_counts falhou", relErr);
      }
    }
  }

  // Devolve o uso do cupom. FORA do `if (wasConfirmed)` de propósito: sold e
  // option_counts só sobem na CONFIRMAÇÃO, mas o cupom é consumido lá atrás,
  // no checkout. Protegido pelo guard atômico (1) acima — o flip
  // paid → refunded —, então rodar concorrente com o webhook não devolve
  // duas vezes. Estorno PARCIAL não chega aqui, igual à vaga.
  if (pay.coupon_id) {
    const { error: cupErr } = await supabaseAdmin.rpc("release_coupon_use", {
      p_coupon_id: pay.coupon_id,
    });
    if (cupErr) console.error("[reconcile-payments/refunds] release_coupon_use falhou", cupErr);
  }

  // (4) Auditoria. Mesma action dos webhooks para a trilha ficar
  // homogênea; `source` distingue quem escreveu.
  const { error: auditErr } = await supabaseAdmin.from("audit_logs").insert({
    actor_email: "system@reconcile-payments",
    action: "ESTORNAR_PAGAMENTO",
    entity_type: "payment",
    entity_id: pay.id,
    details: {
      ...params.auditDetails,
      source: "reconcile-payments/refund-scan",
      registration_id: reg?.id ?? null,
      event_id: eventId,
      was_confirmed: wasConfirmed,
      quantity,
    },
  });
  if (auditErr) console.error("[reconcile-payments/refunds] audit_logs falhou", auditErr);

  console.warn(
    "[reconcile-payments/refunds] estorno não entregue pelo webhook — venda revertida:",
    gateway,
    pay.gateway_transaction_id,
    "→",
    reg?.id ?? "(sem inscrição)",
  );
  return "reverted";
}

function json(
  payload: unknown,
  status = 200,
  cors: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
