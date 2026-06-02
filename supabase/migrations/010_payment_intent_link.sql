-- ============================================================
--  010_payment_intent_link.sql
--  Liga a inscrição ao PaymentIntent do Stripe (ciclo pending →
--  confirmed/cancelled controlado pelo webhook) e adiciona o prazo
--  de pagamento configurável pelo organizador por ingresso.
-- ============================================================

-- Vínculo da inscrição com o PaymentIntent que a originou. Permite ao
-- webhook localizar a inscrição "pending" criada no início do checkout e
-- promovê-la a confirmed (ou cancelá-la). Único por PaymentIntent =
-- idempotência natural.
alter table public.event_registrations
  add column if not exists payment_intent_id text;

create unique index if not exists registrations_payment_intent_idx
  on public.event_registrations(payment_intent_id)
  where payment_intent_id is not null;

-- Prazo de pagamento (em minutos) configurado pelo organizador por ingresso.
-- Aplica-se a métodos assíncronos (pix/boleto): expira o PaymentIntent no
-- gateway; ao expirar, o webhook marca a inscrição como 'cancelled'.
-- null = sem prazo explícito (usa o padrão do gateway).
alter table public.event_tickets
  add column if not exists payment_deadline_minutes integer
  check (payment_deadline_minutes is null or payment_deadline_minutes > 0);
