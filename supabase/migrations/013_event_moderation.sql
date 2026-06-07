-- ============================================================
--  013_event_moderation.sql
--  Moderação de eventos no painel admin.
--  ADITIVO: apenas ADD COLUMN + nova policy. NÃO recria tabelas,
--  NÃO remove policies e NÃO altera o enum event_status.
-- ============================================================

-- ─── EVENTS: motivo de rejeição ─────────────────────────────
-- Preenchido quando o admin rejeita um evento (status -> 'archived').
-- A presença deste campo distingue "rejeitado" de "finalizado".
alter table public.events add column if not exists rejection_reason text;

-- ─── EVENTS: RLS aditiva p/ platform admin (UPDATE) ─────────
-- 008 deu apenas SELECT ao platform admin. Para moderar (aprovar /
-- rejeitar / suspender / reabrir) eventos de QUALQUER organização é
-- necessário UPDATE. Aditiva (OR) à policy de owner/admin da org (003).
-- Espelha "organizations: platform admin atualiza status" (008).
drop policy if exists "events: platform admin atualiza" on public.events;
create policy "events: platform admin atualiza"
  on public.events for update
  using  (public.is_platform_admin())
  with check (public.is_platform_admin());
