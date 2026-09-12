-- 046_ROLLBACK.sql — reverte reserve_ticket_items para a assinatura de 5
-- parâmetros (sem p_expires_at), corpo idêntico ao da 044.
-- Rodar manualmente no SQL Editor do Supabase, nunca via `db push`.

-- 1. Remove a assinatura de 6 parâmetros (introduzida pela 046).
drop function if exists public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb, timestamptz);

-- 2. Recria a versão de 5 parâmetros — corpo exato da 044 (hardcoda
-- expires_at em 15 minutos, sem p_expires_at).
create or replace function public.reserve_ticket_items(
  p_registration_id  uuid,
  p_event_id         uuid,
  p_items            jsonb,   -- [{ "ticket_id": "...", "quantity": n }]
  p_options_reserved boolean default false,
  p_selections       jsonb default '[]'::jsonb
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
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'EMPTY_CART' using errcode = 'P0001';
  end if;

  select user_id into v_user_id
    from public.event_registrations
   where id = p_registration_id;

  -- Ordena por ticket_id: ordem de lock consistente entre chamadas
  -- concorrentes que pedem os mesmos tipos em ordem invertida (evita deadlock).
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
        'held', now() + interval '15 minutes'
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

-- 3. ACL da versão de 5 parâmetros — revoke nos 3 papéis separados (mesmo
-- padrão correto da 041/046, NÃO o "revoke all from public" sozinho que a
-- 044 usou originalmente e que não fecha o grant direto do Supabase a
-- anon/authenticated).
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) from public;
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) from anon;
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) from authenticated;
grant execute on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) to service_role;
