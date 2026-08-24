-- ============================================================
--  042_ticket_lot_groups.sql
--  Lotes sequenciais: tickets do mesmo event_id + lot_group formam uma
--  cadeia ordenada por sort_order. Lote vigente = primeiro em que
--  sold + reserved < quantity. Aditiva e nullable — lot_group null =
--  ingresso avulso, comportamento anterior a esta migration inalterado.
--
--  RLS: as 4 policies de event_tickets (003:142-160) são todas
--  row-level (event_is_public_active(event_id) OR is_event_org_admin
--  (event_id)) — nenhuma referencia coluna específica. Coluna nova
--  nullable não muda nenhuma delas, mesmo padrão de payment_deadline_
--  minutes (010) e reserved (031).
-- ============================================================
alter table public.event_tickets
  add column if not exists lot_group text;

comment on column public.event_tickets.lot_group is
  'Agrupa lotes sequenciais do mesmo evento. Mesmo event_id + lot_group '
  'formam uma cadeia ordenada por sort_order: o lote vigente é o primeiro '
  'em que sold + reserved < quantity. NULL = ingresso avulso (comportamento '
  'anterior a esta migration, inalterado).';

create index if not exists event_tickets_lot_group_idx
  on public.event_tickets(event_id, lot_group)
  where lot_group is not null;
