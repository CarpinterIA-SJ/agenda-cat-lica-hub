-- ============================================================
--  025_refund_decrement_rpcs.sql
--  RPCs de DECREMENTO para tratar estornos (refunds).
--
--  Espelham increment_ticket_sold (018) e tally_option_counts (021),
--  mas liberam a vaga. Usadas SÓ pelo backend (stripe-webhook) quando
--  um pagamento confirmado é estornado. greatest(0, ...) garante que
--  sold/count nunca fiquem negativos (defesa contra reprocesso/ordem).
--
--  ADITIVO: apenas CREATE FUNCTION. Nada de tabelas/policies/enum.
-- ============================================================

-- Libera vaga do ingresso (espelha increment_ticket_sold).
create or replace function public.decrement_ticket_sold(
  p_ticket_id uuid,
  p_quantity  integer
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.event_tickets
  set sold = greatest(0, coalesce(sold, 0) - p_quantity)
  where id = p_ticket_id;
$$;

revoke all on function public.decrement_ticket_sold(uuid, integer) from public;
grant execute on function public.decrement_ticket_sold(uuid, integer) to service_role;

-- Libera vagas por opção (espelha tally_option_counts). Decrementa 1 por
-- opção escolhida; só mexe em linhas que existem (que foram contadas).
create or replace function public.release_option_counts(
  p_event_id   uuid,
  p_selections jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sel   jsonb;
  v_fid text;
  v_opt text;
begin
  for sel in select * from jsonb_array_elements(coalesce(p_selections, '[]'::jsonb))
  loop
    v_fid := sel->>'field_id';
    v_opt := sel->>'option_label';
    if v_fid is null or v_opt is null then
      continue;
    end if;

    update public.event_option_counts
    set count = greatest(0, count - 1)
    where event_id = p_event_id and field_id = v_fid and option_label = v_opt;
  end loop;
end;
$$;

revoke all on function public.release_option_counts(uuid, jsonb) from public;
grant execute on function public.release_option_counts(uuid, jsonb) to service_role;
