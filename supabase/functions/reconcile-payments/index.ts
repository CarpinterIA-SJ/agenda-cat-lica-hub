// ============================================================
//  Edge Function: reconcile-payments
//  Reconciliação de pagamentos cujo webhook nunca chegou.
//
//  Busca event_registrations 'pending' com mais de 2h e consulta o
//  PaymentIntent correspondente direto na API do Stripe:
//   - succeeded  → materializa como o handler do webhook (idempotente)
//   - canceled   → marca a inscrição como 'cancelled'
//   - processing / requires_* → deixa pendente (cliente ainda pode pagar)
//
//  Sem cron automático: testável via invoke manual. Usa service_role.
// ============================================================
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { buildLimitedSelections } from "../_shared/option-counts.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Inscrições pendentes mais antigas que isto são candidatas à reconciliação.
const STALE_HOURS = 2;

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const missingEnv: string[] = [];
  if (!STRIPE_SECRET_KEY) missingEnv.push("STRIPE_SECRET_KEY");
  if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missingEnv.length) {
    console.error("[reconcile-payments] env ausente:", missingEnv.join(", "));
    return json({ error: `Configuração incompleta: ${missingEnv.join(", ")}` }, 500);
  }

  const stats = {
    scanned: 0,
    reconciled_succeeded: 0,
    reconciled_cancelled: 0,
    left_pending: 0,
    skipped_no_intent: 0,
    errors: 0,
  };

  try {
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

    // Inscrições presas em 'pending' há mais de STALE_HOURS.
    // NB: a coluna de criação em event_registrations é `registered_at`
    // (não `created_at`) — usar o nome errado fazia a query falhar (400).
    const { data: stale, error: staleErr } = await supabaseAdmin
      .from("event_registrations")
      .select("id, event_id, ticket_id, user_id, payment_intent_id, custom_fields, registered_at")
      .eq("status", "pending")
      .lt("registered_at", cutoff)
      .order("registered_at", { ascending: true })
      .limit(200);
    if (staleErr) throw staleErr;

    stats.scanned = stale?.length ?? 0;

    for (const reg of stale ?? []) {
      try {
        if (!reg.payment_intent_id) {
          stats.skipped_no_intent++;
          continue;
        }
        const pi = await stripe.paymentIntents.retrieve(reg.payment_intent_id);

        if (pi.status === "succeeded") {
          await handleSucceeded(pi, reg);
          stats.reconciled_succeeded++;
        } else if (pi.status === "canceled") {
          await markCancelled(reg.id);
          stats.reconciled_cancelled++;
        } else {
          // processing | requires_payment_method | requires_action | requires_confirmation
          stats.left_pending++;
        }
      } catch (e) {
        stats.errors++;
        console.error("[reconcile-payments] erro na inscrição", reg.id, (e as Error).message);
      }
    }

    console.log("[reconcile-payments] resultado:", JSON.stringify({ cutoff, ...stats }));
    return json({ ok: true, ...stats }, 200);
  } catch (err) {
    console.error("[reconcile-payments] erro não tratado:", (err as Error).message, err);
    return json({ error: (err as Error).message, ...stats }, 500);
  }
});

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

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
