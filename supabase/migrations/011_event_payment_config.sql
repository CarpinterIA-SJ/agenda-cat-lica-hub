-- ============================================================
--  011_event_payment_config.sql
--  Adiciona a coluna payment_config (jsonb) na tabela events para
--  persistir as preferências de pagamento do organizador.
--
--  Formato esperado do objeto:
--    {
--      "credit_card":  boolean,
--      "pix":          boolean,
--      "boleto":       boolean,
--      "pix_prazo":    number,
--      "pix_unit":     string,   -- 'minutos' | 'horas' | 'dias'
--      "boleto_prazo": number,
--      "auto_cancel":  boolean
--    }
--
--  RLS já existente em events (002_security_hardening) cobre a coluna —
--  organizador da org dona do evento pode atualizar. Nada a alterar aqui.
-- ============================================================

alter table public.events
  add column if not exists payment_config jsonb not null default '{}'::jsonb;
