// ============================================================
//  Edge Function: stripe-checkout
//  Cria um Stripe PaymentIntent para a compra de ingressos.
//  Modelo: taxa da plataforma paga pelo comprador (somada ao subtotal).
// ============================================================
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@^3.23.8";
import { corsHeaders } from "../_shared/cors.ts";

// Valida o payload antes de qualquer processamento.
const checkoutSchema = z.object({
  event_id:    z.string().uuid({ message: "event_id deve ser um uuid válido" }),
  ticket_id:   z.string().uuid({ message: "ticket_id deve ser um uuid válido" }),
  quantity:    z.number().int().min(1).max(10),
  user_id:     z.string().uuid({ message: "user_id deve ser um uuid válido" }),
  coupon_code: z.string().max(50).nullish(),
});

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "payload";
      return json({ error: `Validação falhou: ${field} — ${issue.message}` }, 400);
    }
    const { event_id, ticket_id, quantity, user_id, coupon_code } = parsed.data;

    // Ingresso
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("event_tickets")
      .select("id, name, price_cents, event_id")
      .eq("id", ticket_id)
      .single();
    if (ticketErr || !ticket) return json({ error: "Ingresso não encontrado." }, 404);
    if (ticket.event_id !== event_id) return json({ error: "Ingresso não pertence ao evento." }, 400);

    // Taxa da plataforma
    const { data: setting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "taxa_plataforma_percent")
      .maybeSingle();
    const taxaPercent = Number(setting?.value ?? "5");

    // Subtotal (com cupom opcional)
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
          // valor fixo em reais → centavos
          subtotal = Math.max(0, subtotal - Math.round(Number(coupon.discount_value) * 100));
        }
      }
    }

    const taxa = Math.round(subtotal * (taxaPercent / 100));
    const total = subtotal + taxa;

    if (total < 1) return json({ error: "Valor total inválido para cobrança." }, 400);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "brl",
      payment_method_types: ["card", "boleto", "pix"],
      metadata: {
        event_id,
        ticket_id,
        quantity: String(quantity),
        user_id: user_id ?? "",
        coupon_code: coupon_code ?? "",
        subtotal_cents: String(subtotal),
        fee_cents: String(taxa),
      },
    });

    return json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      subtotal,
      taxa,
      total,
      ticket_name: ticket.name,
    });
  } catch (err) {
    console.error("[stripe-checkout]", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
