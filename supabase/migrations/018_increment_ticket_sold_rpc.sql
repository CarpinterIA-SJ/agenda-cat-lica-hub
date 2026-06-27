-- ============================================================
--  018_increment_ticket_sold_rpc.sql
--  RPC atômica para incrementar event_tickets.sold.
--
--  Motivo: o webhook fazia read-then-update (SELECT sold + UPDATE),
--  que perde incrementos sob concorrência (duas confirmações
--  simultâneas leem o mesmo valor). O UPDATE ... set sold = sold + n
--  dentro de uma única instrução é atômico no Postgres.
--
--  ADITIVO: apenas CREATE FUNCTION. Nenhuma tabela alterada.
-- ============================================================

create or replace function public.increment_ticket_sold(
  p_ticket_id uuid,
  p_quantity  integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.event_tickets
  set sold = coalesce(sold, 0) + p_quantity
  where id = p_ticket_id;
$$;

-- Execução restrita: só o backend (service_role) incrementa sold.
-- Segue o padrão das demais RPCs (revoke public → grant ao papel certo).
revoke all on function public.increment_ticket_sold(uuid, integer) from public;
grant execute on function public.increment_ticket_sold(uuid, integer) to service_role;
