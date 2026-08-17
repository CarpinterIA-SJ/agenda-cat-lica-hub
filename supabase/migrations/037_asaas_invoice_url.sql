-- ============================================================
--  037 — invoice_url do Asaas em event_registrations
-- ============================================================
--
--  PROBLEMA
--  Fechado o AsaasCheckoutModal (ou perdido o QR do PIX por qualquer
--  motivo), o participante não tinha como retomar o pagamento: a
--  cobrança fica ativa e pagável no Asaas, mas invoice_url só era
--  gravada em payments.gateway_payload (jsonb) — e payments não tem
--  policy de SELECT para o dono da inscrição, só para admin da
--  organização e platform admin (003:448, 014). O único dado que
--  chegava ao participante era gateway_charge_id (027), que sozinho não
--  vira link nenhum sem uma chamada nova à API do Asaas.
--
--  SOLUÇÃO
--  Coluna neutra em event_registrations, mesma família de
--  gateway_charge_id (027): grava a invoice_url no momento em que a
--  cobrança nasce (asaas-checkout). RLS de event_registrations já
--  cobre o dono ("registrations: dono vê própria", 003:186) — nenhuma
--  policy nova é necessária. ESTRITAMENTE ADITIVA, como a 027.
-- ============================================================

alter table public.event_registrations
  add column if not exists gateway_invoice_url text;

comment on column public.event_registrations.gateway_invoice_url is
  'URL da fatura hospedada pelo gateway (Asaas: invoice_url), gravada no '
  'momento da criação da cobrança. Permite ao dono da inscrição retomar '
  'um pagamento pendente sem reconsultar a API do gateway. Null para '
  'inscrições gratuitas ou do Stripe (que não hospeda fatura própria).';
