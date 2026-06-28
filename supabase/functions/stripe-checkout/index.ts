// ============================================================
//  Edge Function: stripe-checkout
//  Cria um Stripe PaymentIntent para a compra de ingressos.
//  Modelo: taxa da plataforma paga pelo comprador (somada ao subtotal).
// ============================================================
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@^3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { buildLimitedSelections } from "../_shared/option-counts.ts";

// Valida o payload antes de qualquer processamento.
const checkoutSchema = z.object({
  event_id:    z.string().uuid({ message: "event_id deve ser um uuid válido" }),
  ticket_id:   z.string().uuid({ message: "ticket_id deve ser um uuid válido" }),
  quantity:    z.number().int().min(1).max(10),
  user_id:     z.string().uuid({ message: "user_id deve ser um uuid válido" }),
  coupon_code: z.string().max(50).nullish(),
  // Respostas dos campos personalizados (mesmo objeto do fluxo gratuito).
  custom_fields: z.record(z.any()).optional(),
});

// Variáveis de ambiente (lidas uma vez; ausência derruba a function com erro claro).
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) Variáveis de ambiente obrigatórias.
    const missingEnv: string[] = [];
    if (!STRIPE_SECRET_KEY) missingEnv.push("STRIPE_SECRET_KEY");
    if (!SUPABASE_URL) missingEnv.push("SUPABASE_URL");
    if (!SUPABASE_SERVICE_ROLE_KEY) missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
    if (missingEnv.length) {
      console.error("[stripe-checkout] variáveis de ambiente ausentes:", missingEnv.join(", "));
      return json(
        { error: `Configuração do servidor incompleta: ${missingEnv.join(", ")} não definida(s).` },
        500,
      );
    }

    // 3) Loga o body recebido para diagnóstico.
    const raw = await req.json().catch(() => null);
    console.log("[stripe-checkout] body recebido:", JSON.stringify(raw));

    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue.path.join(".") || "payload";
      return json({ error: `Dados inválidos: ${field} — ${issue.message}` }, 400);
    }
    const { event_id, ticket_id, quantity, user_id, coupon_code, custom_fields } = parsed.data;

    // 4) Ingresso (apenas colunas garantidas no schema base).
    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from("event_tickets")
      .select("id, name, price_cents, event_id")
      .eq("id", ticket_id)
      .maybeSingle();
    if (ticketErr) {
      console.error("[stripe-checkout] erro ao buscar ingresso:", ticketErr);
      return json({ error: `Falha ao buscar o ingresso: ${ticketErr.message}` }, 500);
    }
    if (!ticket) {
      return json({ error: "Ingresso não encontrado. Verifique se o ingresso ainda está disponível." }, 404);
    }
    if (ticket.event_id !== event_id) {
      return json({ error: "Este ingresso não pertence ao evento informado." }, 400);
    }

    // Prazo de pagamento é coluna opcional (migration 010). Busca isolada para
    // não derrubar o checkout caso a migration ainda não tenha sido aplicada.
    let deadlineMin: number | null = null;
    {
      const { data: deadlineRow, error: deadlineErr } = await supabaseAdmin
        .from("event_tickets")
        .select("payment_deadline_minutes")
        .eq("id", ticket_id)
        .maybeSingle();
      if (deadlineErr) {
        console.warn("[stripe-checkout] payment_deadline_minutes indisponível (migration 010 pendente?):", deadlineErr.message);
      } else {
        deadlineMin = (deadlineRow as any)?.payment_deadline_minutes ?? null;
      }
    }

    // 5) Taxa da plataforma — SEMPRE recalculada server-side a partir do banco.
    // Qualquer valor de taxa enviado no payload é ignorado (o checkoutSchema nem
    // o aceita). Nunca confie no cliente para o cálculo da cobrança.
    const { data: setting, error: settingErr } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "taxa_plataforma_percent")
      .maybeSingle();
    if (settingErr) {
      console.warn("[stripe-checkout] erro ao ler taxa_plataforma_percent, usando 5:", settingErr.message);
    }
    const parsedPercent = Number(setting?.value);
    const taxaPercent = Number.isFinite(parsedPercent) && parsedPercent >= 0 ? parsedPercent : 5;
    console.log("[stripe-checkout] taxa aplicada:", taxaPercent);

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

    // Fase C: soft-gate de vagas por opção. Se uma opção escolhida já
    // esgotou, rejeita ANTES de criar o PaymentIntent (não deixa pagar por
    // vaga inexistente). A contagem DEFINITIVA acontece no webhook (succeeded),
    // espelhando o sold — por isso aqui é só leitura, não reserva.
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

    // Prazo de pagamento configurado pelo organizador → expiração no gateway
    // para o método assíncrono (boleto). Limites do Stripe respeitados.
    const paymentMethodOptions: Record<string, unknown> = {};
    if (deadlineMin && deadlineMin > 0) {
      const boletoDays = Math.min(Math.max(Math.ceil(deadlineMin / 1440), 1), 60); // 1..60 dias
      paymentMethodOptions.boleto = { expires_after_days: boletoDays };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "brl",
      payment_method_types: ["card", "boleto"],
      ...(Object.keys(paymentMethodOptions).length
        ? { payment_method_options: paymentMethodOptions as any }
        : {}),
      metadata: {
        event_id,
        ticket_id,
        quantity: String(quantity),
        user_id: user_id ?? "",
        coupon_code: coupon_code ?? "",
        subtotal_cents: String(subtotal),
        fee_cents: String(taxa),
        payment_deadline_minutes: deadlineMin ? String(deadlineMin) : "",
      },
    });

    // Dados do comprador para a inscrição pendente.
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

    // Inscrição PENDING vinculada ao PaymentIntent. O webhook a promove a
    // 'confirmed' (succeeded) ou 'cancelled' (failed/canceled/expirado).
    const { error: regErr } = await supabaseAdmin.from("event_registrations").insert({
      event_id,
      ticket_id,
      user_id,
      full_name: fullName,
      email: email || "sem-email@guardiaoeventos.com",
      status: "pending",
      payment_intent_id: paymentIntent.id,
      // Opção 1: grava as respostas direto no pending. O webhook só promove
      // o status (UPDATE não toca custom_fields), então elas persistem.
      custom_fields: custom_fields ?? {},
    });
    if (regErr) {
      // Não bloqueia o pagamento: webhook tem fallback de insert idempotente.
      console.error("[stripe-checkout] falha ao criar inscrição pendente", regErr);
    }

    return json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      subtotal,
      taxa,
      total,
      ticket_name: ticket.name,
    });
  } catch (err) {
    // 2) Erro detalhado no corpo da resposta para facilitar o diagnóstico.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-checkout] erro não tratado:", message, err);
    return json({ error: `Erro ao iniciar o pagamento: ${message}` }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
