// ============================================================
//  Edge Function: stripe-webhook
//  Recebe eventos do Stripe e materializa inscrição + pagamento.
//  Usa service_role para bypassar RLS (mutações de payments são
//  exclusivas do backend).
// ============================================================
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const methodMap: Record<string, string> = {
  card: "credit_card",
  pix: "pix",
  boleto: "boleto",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verificação obrigatória da assinatura Stripe antes de processar qualquer evento.
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET não configurado");
    return new Response("Webhook secret não configurado.", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe-webhook] header stripe-signature ausente");
    return new Response("Assinatura ausente.", { status: 400 });
  }

  const bodyText = await req.text();

  let evt: Stripe.Event;
  try {
    evt = await stripe.webhooks.constructEventAsync(
      bodyText,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error("[stripe-webhook] assinatura inválida", err);
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    if (evt.type === "payment_intent.succeeded") {
      await handleSucceeded(evt.data.object as Stripe.PaymentIntent);
    } else if (
      evt.type === "payment_intent.payment_failed" ||
      evt.type === "payment_intent.canceled"
    ) {
      // payment_failed: recusa do método. canceled: PaymentIntent expirado
      // (prazo do organizador atingido em pix/boleto) ou cancelado.
      const reason = evt.type === "payment_intent.canceled" ? "cancelled" : "failed";
      await handleUnpaid(evt.data.object as Stripe.PaymentIntent, reason);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] erro ao processar", err);
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }
});

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

async function handleSucceeded(pi: Stripe.PaymentIntent) {
  const m = pi.metadata ?? {};
  const eventId = m.event_id;
  const ticketId = m.ticket_id;
  const quantity = Math.max(1, Number(m.quantity ?? "1"));
  const userId = m.user_id || null;
  const feeCents = Number(m.fee_cents ?? "0");
  const amount = pi.amount; // total cobrado
  const netCents = amount - feeCents;

  if (!eventId || !ticketId) return;

  // Idempotência: se já existe payment com esse PaymentIntent, ignora.
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("gateway_transaction_id", pi.id)
    .maybeSingle();
  if (existing) return;

  // organization_id do evento
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("organization_id")
    .eq("id", eventId)
    .single();
  if (!event) return;

  // Dados do comprador
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

  // Promove a inscrição PENDING (criada no início do checkout) a 'confirmed'.
  // Fallback: se não existir (checkout antigo / falha ao criar), insere nova.
  let registration: { id: string };
  const { data: pendingReg } = await supabaseAdmin
    .from("event_registrations")
    .select("id")
    .eq("payment_intent_id", pi.id)
    .maybeSingle();

  if (pendingReg) {
    const { data: updated, error: updErr } = await supabaseAdmin
      .from("event_registrations")
      .update({ status: "confirmed", full_name: fullName, email: email || "sem-email@guardiaoeventos.com" })
      .eq("id", pendingReg.id)
      .select("id")
      .single();
    if (updErr) throw updErr;
    registration = updated;
  } else {
    const { data: inserted, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id: eventId,
        ticket_id: ticketId,
        user_id: userId,
        full_name: fullName,
        email: email || "sem-email@guardiaoeventos.com",
        status: "confirmed",
        payment_intent_id: pi.id,
      })
      .select("id")
      .single();
    if (regErr) throw regErr;
    registration = inserted;
  }

  // Pagamento (status paid)
  const method = await resolveMethod(pi);
  const { error: payErr } = await supabaseAdmin.from("payments").insert({
    organization_id: event.organization_id,
    event_id: eventId,
    registration_id: registration.id,
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

  // Atualiza sold do ingresso
  const { data: ticket } = await supabaseAdmin
    .from("event_tickets")
    .select("sold")
    .eq("id", ticketId)
    .single();
  if (ticket) {
    await supabaseAdmin
      .from("event_tickets")
      .update({ sold: (ticket.sold ?? 0) + quantity })
      .eq("id", ticketId);
  }
}

async function handleUnpaid(pi: Stripe.PaymentIntent, reason: "failed" | "cancelled") {
  const m = pi.metadata ?? {};
  const eventId = m.event_id;
  const feeCents = Number(m.fee_cents ?? "0");

  if (!eventId) return;

  // Cancela a inscrição pendente vinculada ao PaymentIntent.
  const { data: pendingReg } = await supabaseAdmin
    .from("event_registrations")
    .select("id, status")
    .eq("payment_intent_id", pi.id)
    .maybeSingle();
  if (pendingReg && pendingReg.status !== "confirmed") {
    await supabaseAdmin
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", pendingReg.id);
  }

  // Idempotência do registro de pagamento.
  const { data: existing } = await supabaseAdmin
    .from("payments")
    .select("id")
    .eq("gateway_transaction_id", pi.id)
    .maybeSingle();
  if (existing) return;

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("organization_id")
    .eq("id", eventId)
    .single();
  if (!event) return;

  await supabaseAdmin.from("payments").insert({
    organization_id: event.organization_id,
    event_id: eventId,
    registration_id: pendingReg?.id ?? null,
    amount_cents: pi.amount,
    fee_cents: feeCents,
    net_cents: pi.amount - feeCents,
    currency: "BRL",
    method: "credit_card",
    status: reason === "cancelled" ? "cancelled" : "failed",
    gateway: "stripe",
    gateway_transaction_id: pi.id,
  });
}
