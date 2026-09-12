-- 046_reserve_ticket_items_expires_at.sql
-- reserve_ticket_items (044) hardcoda expires_at em 15 min; asaas-checkout
-- precisa da expiração real (data de vencimento da cobrança), não um valor fixo.

-- DROP explícito da assinatura antiga (5 params) ANTES do CREATE — mesma
-- lição da create_free_registration: adicionar parâmetro via CREATE OR
-- REPLACE cria overload em vez de substituir.
drop function if exists public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb);

create or replace function public.reserve_ticket_items(
  p_registration_id  uuid,
  p_event_id         uuid,
  p_items            jsonb,
  p_options_reserved boolean default false,
  p_selections       jsonb default '[]'::jsonb,
  p_expires_at       timestamptz default null
)
returns uuid[]
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id     uuid;
  v_item        record;
  v_ticket_id   uuid;
  v_qty         integer;
  v_unit_price  integer;
  v_rows        integer;
  v_id          uuid;
  v_ids         uuid[] := array[]::uuid[];
  v_first       boolean := true;
  v_constraint  text;
  v_expires     timestamptz := coalesce(p_expires_at, now() + interval '15 minutes');
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  select user_id into v_user_id
    from public.event_registrations
   where id = p_registration_id;

  for v_item in
    select (elem->>'ticket_id')::uuid as ticket_id,
           (elem->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items) as elem
     order by (elem->>'ticket_id')::uuid
  loop
    v_ticket_id := v_item.ticket_id;
    v_qty       := coalesce(v_item.quantity, 1);

    if v_qty <= 0 then
      raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
    end if;

    update public.event_tickets
       set reserved = coalesce(reserved, 0) + v_qty
     where id = v_ticket_id
       and event_id = p_event_id
       and (
         quantity = 0
         or coalesce(sold, 0) + coalesce(reserved, 0) + v_qty <= quantity
       )
    returning price_cents into v_unit_price;

    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      if not exists (
        select 1 from public.event_tickets
         where id = v_ticket_id and event_id = p_event_id
      ) then
        raise exception 'TICKET_NOT_FOUND' using errcode = 'P0001';
      end if;
      raise exception 'TICKET_FULL' using errcode = 'P0001';
    end if;

    insert into public.registration_ticket_items (
      registration_id, event_id, ticket_id, quantity, unit_price_cents
    )
    values (
      p_registration_id, p_event_id, v_ticket_id, v_qty, coalesce(v_unit_price, 0)
    );

    begin
      insert into public.ticket_reservations (
        registration_id, ticket_id, event_id, user_id, quantity,
        options_reserved, selections, status, expires_at
      )
      values (
        p_registration_id, v_ticket_id, p_event_id, v_user_id, v_qty,
        case when v_first then coalesce(p_options_reserved, false) else false end,
        case when v_first then coalesce(p_selections, '[]'::jsonb) else '[]'::jsonb end,
        'held', v_expires
      )
      returning id into v_id;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;
        if v_constraint = 'ticket_reservations_one_hold_per_registration_ticket' then
          raise exception 'DUPLICATE_HOLD' using errcode = 'P0001';
        end if;
        raise;
    end;

    v_ids := array_append(v_ids, v_id);
    v_first := false;
  end loop;

  return v_ids;
end;
$function$;

-- ACL: função recriada = nova pro Postgres, ganha anon/authenticated por
-- ALTER DEFAULT PRIVILEGES. Fechar de novo, mesmo padrão de 031/041/044.
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb, timestamptz) from public;
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb, timestamptz) from anon;
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb, timestamptz) from authenticated;
grant execute on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb, timestamptz) to service_role;
