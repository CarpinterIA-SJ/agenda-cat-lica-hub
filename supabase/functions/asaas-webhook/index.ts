// ============================================================
//  Edge Function: asaas-webhook
//  Recebe eventos do Asaas e materializa inscrição + pagamento.
//
//  Paralela ao stripe-webhook — nenhum arquivo do Stripe é tocado.
//
//  Autenticação: token ESTÁTICO no header `asaas-access-token`, não
//  HMAC como o Stripe. Consequência prática: o token é um segredo de
//  longa duração e a comparação precisa ser em tempo constante; não há
//  como verificar que o corpo não foi adulterado além de confiar no
//  TLS + token. Por isso nada vindo do corpo é usado como autoridade
//  para VALOR — o valor cobrado é o que gravamos em payments no
//  checkout, não o `payment.value` do webhook.
//
//  Deploy: sem verificação de JWT do Supabase (o Asaas não envia um).
//    supabase functions deploy asaas-webhook --no-verify-jwt
//  Também declarado em supabase/config.toml ([functions.asaas-webhook]).
//
//  EVENTOS A HABILITAR no painel do Asaas (Integrações > Webhooks).
//  Habilitar exatamente estes seis — nem menos (perde-se tratamento),
//  nem todos (eventos ruidosos só gastam entrega da fila):
//
//    PAYMENT_CONFIRMED           → confirma a inscrição
//    PAYMENT_RECEIVED            → idem (o Asaas manda os dois)
//    PAYMENT_OVERDUE             → cobrança venceu sem pagamento
//    PAYMENT_DELETED             → cobrança removida antes de pagar
//    PAYMENT_REFUNDED            → estorno total: reverte a venda
//    PAYMENT_PARTIALLY_REFUNDED  → só registra (ver handler)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildLimitedSelections } from "../_shared/option-counts.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

/** Comparação em tempo constante — não vaza o token por timing. */
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

interface AsaasWebhookPayment {
  id: string;
  status?: string;
  value?: number;
  netValue?: number;
  billingType?: string;
  externalReference?: string | null;
}

interface AsaasWebhookBody {
  event?: string;
  payment?: AsaasWebhookPayment;
}

Deno.serve(async (req) => {
  // Sem CORS: este endpoint é servidor→servidor. Um preflight de browser
  // aqui não é um caso de uso legítimo.
  if (req.method !== "POST") {
    return new Response("Method not allowed.", { status: 405 });
  }

  if (!WEBHOOK_TOKEN) {
    console.error("[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado");
    return new Response("Webhook token não configurado.", { status: 500 });
  }

  const provided = req.headers.get("asaas-access-token") ?? "";
  if (!provided || !safeEqual(provided, WEBHOOK_TOKEN)) {
    console.warn("[asaas-webhook] token inválido ou ausente");
    return new Response("Token inválido.", { status: 401 });
  }

  let body: AsaasWebhookBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Corpo inválido.", { status: 400 });
  }

  const eventType = body.event ?? "";
  const payment = body.payment;

  if (!payment?.id) {
    // Nada a fazer, mas é um evento bem-formado do ponto de vista do Asaas:
    // responde 200 para não contar como falha na fila dele.
    console.warn("[asaas-webhook] evento sem payment.id:", eventType);
    return ok();
  }

  console.log("[asaas-webhook] recebido:", eventType, payment.id);

  try {
    switch (eventType) {
      // O Asaas manda os DOIS para a mesma cobrança (CONFIRMED = confirmado,
      // RECEIVED = valor liquidado). O guard atômico abaixo garante que só o
      // primeiro produz efeito.
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        await handlePaid(payment);
        break;

      case "PAYMENT_REFUNDED":
        await handleRefunded(payment);
        break;

      case "PAYMENT_PARTIALLY_REFUNDED":
        // Mesmo tratamento do Stripe hoje: registra e NÃO reverte. Cancelar a
        // inscrição e liberar a vaga por um estorno parcial seria incorreto —
        // o participante pagou parte e segue inscrito. LIMITAÇÃO CONHECIDA:
        // o ajuste financeiro precisa ser feito à mão pelo admin.
        console.warn("[asaas-webhook] estorno parcial ignorado (sem reversão):", payment.id);
        break;

      // Cobrança deixou de ser pagável sem ter sido paga: venceu (OVERDUE) ou
      // foi removida no Asaas (DELETED). Sem isto a inscrição ficaria 'pending'
      // para sempre, segurando a vaga — o Stripe já cobre o caso equivalente
      // via payment_intent.canceled.
      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
        await handleUnpaid(payment, eventType);
        break;

      default:
        // PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_ANTICIPATED etc.
        console.log("[asaas-webhook] evento ignorado:", eventType);
    }

    return ok();
  } catch (err) {
    // 500 faz o Asaas reenviar (entrega at least once + nossa idempotência
    // tornam o reenvio seguro). ATENÇÃO OPERACIONAL: após 15 falhas
    // consecutivas o Asaas PARA a fila inteira — um erro persistente aqui
    // precisa de alarme, não só de log.
    console.error("[asaas-webhook] erro ao processar", eventType, payment.id, err);
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }
});

const ok = (): Response =>
  new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

// ─── Pagamento confirmado ───────────────────────────────────

async function handlePaid(payment: AsaasWebhookPayment) {
  // A linha de payments é criada como 'pending' pelo asaas-checkout, com
  // quantity/fee em gateway_payload — o Asaas não carrega metadata própria.
  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("id, status, event_id, registration_id, gateway_payload, amount_cents, fee_cents")
    .eq("gateway_transaction_id", payment.id)
    .maybeSingle();

  if (!pay) {
    // Cobrança que não nasceu no checkout da plataforma — avulsa, criada
    // direto no painel do Asaas. A mesma conta Asaas é usada para outras
    // coisas, então isto é ESPERADO, não erro: loga e ignora (200).
    //
    // Não lançar aqui é requisito operacional, não higiene de log: a fila do
    // Asaas é SEQUENCIAL e para inteira após 15 falhas consecutivas — um
    // evento impossível de processar bloquearia todos os seguintes.
    console.warn("[asaas-webhook] pagamento sem linha em payments — ignorado:", payment.id);
    return;
  }

  // IDEMPOTÊNCIA (guard atômico): só quem transita pending → paid segue.
  // O segundo evento (CONFIRMED depois de RECEIVED, ou um reenvio) encontra
  // status já 'paid' → 0 linhas → return, sem incrementar sold de novo.
  const { data: flipped } = await supabaseAdmin
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", pay.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!flipped) {
    console.log("[asaas-webhook] pagamento já processado, ignorando:", payment.id);
    return;
  }

  const gp = (pay.gateway_payload ?? {}) as Record<string, unknown>;
  const quantity = Math.max(1, Number(gp.quantity ?? 1));
  const ticketId = (gp.ticket_id as string) ?? null;
  const eventId = pay.event_id as string | null;

  // Promove a inscrição pendente. Casada por gateway_charge_id (índice único
  // parcial da migration 027); externalReference é o fallback.
  const { data: reg } = await supabaseAdmin
    .from("event_registrations")
    .select("id, status, ticket_id, custom_fields")
    .eq("gateway_charge_id", payment.id)
    .maybeSingle();

  const registrationId = reg?.id
    ?? pay.registration_id
    ?? payment.externalReference
    ?? null;

  let regAnswers: unknown = reg?.custom_fields ?? null;

  if (registrationId) {
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("event_registrations")
      .update({ status: "confirmed" })
      .eq("id", registrationId)
      .neq("status", "confirmed")
      .select("id, custom_fields")
      .maybeSingle();
    if (updErr) throw updErr;
    if (updated?.custom_fields != null) regAnswers = updated.custom_fields;
  } else {
    console.error("[asaas-webhook] pagamento pago sem inscrição vinculada:", payment.id);
  }

  // Incremento atômico de sold (RPC da migration 018).
  const effectiveTicketId = ticketId ?? reg?.ticket_id ?? null;
  if (effectiveTicketId) {
    const { error: soldErr } = await supabaseAdmin.rpc("increment_ticket_sold", {
      p_ticket_id: effectiveTicketId,
      p_quantity: quantity,
    });
    if (soldErr) throw soldErr;
  } else {
    console.error("[asaas-webhook] sem ticket_id para incrementar sold:", payment.id);
  }

  // Fase C: contabiliza vagas por opção (venda final, incondicional).
  // Best-effort — não derruba o webhook: o pagamento já está registrado.
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
      if (optErr) console.error("[asaas-webhook] tally_option_counts falhou", optErr);
    }
  }
}

// ─── Cobrança vencida ou removida (nunca paga) ──────────────

/**
 * PAYMENT_OVERDUE / PAYMENT_DELETED: a cobrança deixou de ser pagável sem
 * nunca ter sido paga. Libera a inscrição presa em 'pending'.
 *
 * Escolha do status em payments: 'cancelled', não 'failed'. No enum
 * payment_status existente, 'failed' é o que o stripe-webhook grava para
 * payment_intent.payment_failed — uma tentativa de pagamento RECUSADA. Aqui
 * não houve tentativa alguma: o prazo acabou (ou a cobrança foi apagada).
 * O stripe-webhook mapeia exatamente esse caso — PaymentIntent expirado por
 * atingir o prazo do organizador — para 'cancelled'. Mantemos a paridade.
 *
 * NÃO decrementa sold nem option_counts, de propósito: no modelo espelhado
 * do Stripe esses contadores só são incrementados na CONFIRMAÇÃO do
 * pagamento. Uma cobrança que nunca foi paga jamais os incrementou, então
 * decrementar aqui roubaria vaga de outra pessoa.
 */
async function handleUnpaid(payment: AsaasWebhookPayment, eventType: string) {
  // Inscrição vinculada (mesmo mecanismo dos outros handlers).
  const { data: reg } = await supabaseAdmin
    .from("event_registrations")
    .select("id, status, event_id")
    .eq("gateway_charge_id", payment.id)
    .maybeSingle();

  // Segurança: vencimento/remoção não deveria alcançar uma inscrição já
  // confirmada. Se alcançar, é ordem invertida de eventos ou pagamento fora
  // do fluxo — loga e sai SEM alterar nada. Desfazer uma venda boa por causa
  // de um evento tardio seria muito pior que o alerta ficar no log.
  if (reg?.status === "confirmed") {
    console.warn(
      "[asaas-webhook] %s recebido para inscrição já confirmada — nada alterado:",
      eventType, payment.id,
    );
    return;
  }

  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("id, status, event_id")
    .eq("gateway_transaction_id", payment.id)
    .maybeSingle();

  // Mesma proteção do lado do pagamento: se já está pago/estornado, este
  // evento chegou fora de ordem e não manda em nada.
  if (pay && (pay.status === "paid" || pay.status === "refunded")) {
    console.warn(
      "[asaas-webhook] %s recebido para pagamento em status '%s' — nada alterado:",
      eventType, pay.status, payment.id,
    );
    return;
  }

  // IDEMPOTÊNCIA (guard atômico), mesmo padrão dos demais handlers: só quem
  // transita pending → cancelled conta como mudança. Um reenvio encontra a
  // linha já em 'cancelled' → 0 linhas → nada a fazer.
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

  // Idem para a inscrição. O guard por status torna este update seguro de
  // repetir e impede que uma inscrição 'confirmed' seja atingida numa corrida
  // entre a checagem acima e este update.
  let registrationChanged = false;
  if (reg) {
    const { data: flippedReg } = await supabaseAdmin
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", reg.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    registrationChanged = !!flippedReg;
  }

  if (!pay && !reg) {
    console.warn("[asaas-webhook] %s sem pagamento nem inscrição correspondente:", eventType, payment.id);
    return;
  }

  // Só audita quando algo de fato mudou — assim o reenvio do mesmo evento
  // não gera linhas duplicadas na trilha.
  if (!paymentChanged && !registrationChanged) {
    console.log("[asaas-webhook] %s já processado, ignorando:", eventType, payment.id);
    return;
  }

  const { error: auditErr } = await supabaseAdmin.from("audit_logs").insert({
    actor_email: "system@asaas-webhook",
    action: "CANCELAR_COBRANCA_NAO_PAGA",
    entity_type: "payment",
    entity_id: pay?.id ?? reg?.id ?? null,
    details: {
      gateway: "asaas",
      asaas_event: eventType,
      charge_id: payment.id,
      registration_id: reg?.id ?? null,
      event_id: pay?.event_id ?? reg?.event_id ?? null,
      payment_cancelled: paymentChanged,
      registration_cancelled: registrationChanged,
    },
  });
  if (auditErr) console.error("[asaas-webhook] audit_logs cobrança não paga falhou", auditErr);
}

// ─── Estorno total ──────────────────────────────────────────

async function handleRefunded(payment: AsaasWebhookPayment) {
  const { data: pay } = await supabaseAdmin
    .from("payments")
    .select("id, status, event_id, gateway_payload")
    .eq("gateway_transaction_id", payment.id)
    .maybeSingle();
  if (!pay) {
    console.warn("[asaas-webhook] estorno sem payment correspondente:", payment.id);
    return;
  }

  // IDEMPOTÊNCIA (guard atômico): só reverte quem transita paid → refunded.
  // Mesmo padrão do handleRefunded do stripe-webhook.
  const { data: flipped } = await supabaseAdmin
    .from("payments")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", pay.id)
    .eq("status", "paid")
    .select("id")
    .maybeSingle();
  if (!flipped) {
    console.log("[asaas-webhook] estorno já processado (ou pagamento não estava pago):", payment.id);
    return;
  }

  const gp = (pay.gateway_payload ?? {}) as Record<string, unknown>;
  const quantity = Math.max(1, Number(gp.quantity ?? 1));
  const eventId = pay.event_id as string | null;

  // Captura o status ANTES de cancelar: só libera vaga se estava 'confirmed',
  // pois só aí sold/option_counts chegaram a ser contados.
  const { data: reg } = await supabaseAdmin
    .from("event_registrations")
    .select("id, status, ticket_id, custom_fields")
    .eq("gateway_charge_id", payment.id)
    .maybeSingle();
  const wasConfirmed = reg?.status === "confirmed";
  const ticketId = (reg as any)?.ticket_id ?? (gp.ticket_id as string) ?? null;

  if (reg && reg.status !== "cancelled") {
    await supabaseAdmin
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", reg.id);
  }

  if (wasConfirmed) {
    if (ticketId) {
      const { error: decErr } = await supabaseAdmin.rpc("decrement_ticket_sold", {
        p_ticket_id: ticketId,
        p_quantity: quantity,
      });
      if (decErr) console.error("[asaas-webhook] decrement_ticket_sold falhou", decErr);
    }
    if (eventId) {
      const { data: ev } = await supabaseAdmin
        .from("events")
        .select("custom_fields")
        .eq("id", eventId)
        .maybeSingle();
      const selections = buildLimitedSelections((ev as any)?.custom_fields, (reg as any)?.custom_fields);
      if (selections.length) {
        const { error: relErr } = await supabaseAdmin.rpc("release_option_counts", {
          p_event_id: eventId,
          p_selections: selections,
        });
        if (relErr) console.error("[asaas-webhook] release_option_counts falhou", relErr);
      }
    }
  }

  // Auditoria (service_role bypassa RLS). Best-effort.
  const { error: auditErr } = await supabaseAdmin.from("audit_logs").insert({
    actor_email: "system@asaas-webhook",
    action: "ESTORNAR_PAGAMENTO",
    entity_type: "payment",
    entity_id: pay.id,
    details: {
      gateway: "asaas",
      charge_id: payment.id,
      registration_id: reg?.id ?? null,
      event_id: eventId,
      was_confirmed: wasConfirmed,
    },
  });
  if (auditErr) console.error("[asaas-webhook] audit_logs refund falhou", auditErr);
}
