-- 044_ROLLBACK.sql — reverte o carrinho multi-tipo para o estado anterior à 044.
-- Rodar manualmente no SQL Editor do Supabase, nunca via `db push`.

-- 1. Remove a função nova (não existia antes da 044).
drop function if exists public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb);

-- 2. create_free_registration: precisa de DROP explícito da assinatura NOVA
--    antes do CREATE, porque CREATE OR REPLACE não remove parâmetro (p_items).
drop function if exists public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text, jsonb
);

create or replace function public.create_free_registration(p_event_id uuid, p_ticket_id uuid DEFAULT NULL::uuid, p_full_name text DEFAULT ''::text, p_email text DEFAULT ''::text, p_cpf text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_birth_date date DEFAULT NULL::date, p_custom_fields jsonb DEFAULT '{}'::jsonb, p_selections jsonb DEFAULT '[]'::jsonb, p_coupon_code text DEFAULT NULL::text)
 returns event_registrations
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_uid            uuid := auth.uid();
  v_coupon_id      uuid;
  v_kind           public.discount_kind;
  v_value          numeric;
  v_price          integer := 0;
  v_sales_start    timestamptz;
  v_sales_end      timestamptz;
  v_efetivo        numeric;
  v_reg            public.event_registrations;
  v_confirm_result text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  if not (public.event_is_public_active(p_event_id)
          or public.is_event_org_admin(p_event_id)) then
    raise exception 'EVENT_NOT_OPEN' using errcode = 'P0001';
  end if;

  perform public.reserve_option_counts(p_event_id, p_selections);

  if p_coupon_code is not null then
    v_coupon_id := public.consume_coupon(p_event_id, p_coupon_code);
  end if;

  if p_ticket_id is not null then
    select t.price_cents, t.sales_start_at, t.sales_end_at
      into v_price, v_sales_start, v_sales_end
      from public.event_tickets t
     where t.id = p_ticket_id and t.event_id = p_event_id;
    if not found then
      raise exception 'TICKET_NOT_IN_EVENT' using errcode = 'P0001';
    end if;

    if v_sales_start is not null and now() < v_sales_start
       and not public.is_event_org_admin(p_event_id) then
      raise exception 'SALES_NOT_STARTED' using errcode = 'P0001';
    end if;
    if v_sales_end is not null and now() > v_sales_end
       and not public.is_event_org_admin(p_event_id) then
      raise exception 'SALES_ENDED' using errcode = 'P0001';
    end if;
  end if;

  v_efetivo := coalesce(v_price, 0);

  if v_coupon_id is not null then
    select c.discount_kind, c.discount_value into v_kind, v_value
      from public.coupons c where c.id = v_coupon_id;
    if v_kind = 'percent' then
      v_efetivo := greatest(0, v_efetivo - (v_efetivo * v_value / 100.0));
    else
      v_efetivo := greatest(0, v_efetivo - round(v_value * 100));
    end if;
  end if;

  if floor(v_efetivo) > 0 then
    raise exception 'PAYMENT_REQUIRED' using errcode = 'P0001';
  end if;

  insert into public.event_registrations
    (event_id, ticket_id, user_id, full_name, email, cpf, phone,
     birth_date, custom_fields, coupon_id, status)
  values
    (p_event_id, p_ticket_id, v_uid, p_full_name, p_email, p_cpf, p_phone,
     p_birth_date, coalesce(p_custom_fields, '{}'::jsonb), v_coupon_id, 'confirmed')
  returning * into v_reg;

  if p_ticket_id is not null then
    perform public.reserve_ticket_sold(
      p_registration_id  => v_reg.id,
      p_event_id         => p_event_id,
      p_ticket_id        => p_ticket_id,
      p_quantity         => 1,
      p_expires_at       => now(),
      p_options_reserved => jsonb_array_length(coalesce(p_selections, '[]'::jsonb)) > 0,
      p_selections       => coalesce(p_selections, '[]'::jsonb)
    );

    v_confirm_result := public.confirm_ticket_reservation(v_reg.id);

    if v_confirm_result <> 'CONFIRMED' then
      raise exception 'RESERVATION_LOST' using errcode = 'P0001';
    end if;
  end if;

  return v_reg;
end;
$function$;

-- 3. confirm_ticket_reservation: volta pra versão "1 linha por pedido".
create or replace function public.confirm_ticket_reservation(p_registration_id uuid)
 returns text
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_ticket uuid;
  v_qty    integer;
  v_status text;
begin
  update public.ticket_reservations
     set status = 'confirmed', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'held'
  returning ticket_id, quantity into v_ticket, v_qty;

  if found then
    if v_ticket is not null then
      update public.event_tickets
         set reserved = greatest(0, coalesce(reserved, 0) - v_qty),
             sold     = coalesce(sold, 0) + v_qty
       where id = v_ticket;
    end if;
    return 'CONFIRMED';
  end if;

  select status into v_status
    from public.ticket_reservations
   where registration_id = p_registration_id;

  if v_status = 'confirmed' then
    return 'ALREADY_CONFIRMED';
  elsif v_status = 'released' then
    return 'RELEASED';
  else
    return 'NOT_FOUND';
  end if;
end;
$function$;

-- 4. release_ticket_reservation: volta pra versão "1 linha por pedido".
create or replace function public.release_ticket_reservation(p_registration_id uuid)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_ticket     uuid;
  v_qty        integer;
  v_event      uuid;
  v_opts       boolean;
  v_selections jsonb;
begin
  update public.ticket_reservations
     set status = 'released', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'held'
  returning ticket_id, quantity, event_id, options_reserved, selections
       into v_ticket, v_qty, v_event, v_opts, v_selections;

  if not found then
    return false;
  end if;

  if v_ticket is not null then
    update public.event_tickets
       set reserved = greatest(0, coalesce(reserved, 0) - v_qty)
     where id = v_ticket;
  end if;

  if v_opts then
    perform public.release_option_counts(v_event, v_selections);
  end if;

  return true;
end;
$function$;

-- 5. release_ticket_hold: volta pra versão SEM o filtro de ticket_id
--    (restaura o bug original — é rollback, não correção).
create or replace function public.release_ticket_hold(p_registration_id uuid, p_ticket_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_qty integer;
begin
  if p_ticket_id is null then
    return;
  end if;

  update public.ticket_reservations
     set status = 'released', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'confirmed'
  returning quantity into v_qty;

  if not found then
    return;
  end if;

  update public.event_tickets
     set sold = greatest(coalesce(sold, 0) - coalesce(v_qty, 1), 0)
   where id = p_ticket_id;
end;
$function$;

-- 6. Índices: volta pro par antigo, remove os dois novos.
drop index if exists public.ticket_reservations_one_hold_per_registration_ticket;
drop index if exists public.registrations_one_pending_per_user_event;

create unique index ticket_reservations_active_uniq
  on public.ticket_reservations using btree (registration_id)
  where (status = 'held');

create unique index ticket_reservations_one_hold_per_user_event
  on public.ticket_reservations using btree (user_id, event_id)
  where (status = 'held');

-- 7. Tabela nova: removida por último, depois que nada mais referencia ela.
drop table if exists public.registration_ticket_items;
