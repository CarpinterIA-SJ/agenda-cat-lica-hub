-- 044_multi_item_cart.sql
-- JÁ APLICADA em produção via SQL Editor em 2026-09-11. Este arquivo
-- é o registro para o repositório — idempotente, seguro rodar de novo.

-- 1. Nova tabela: uma linha por tipo de ingresso dentro do pedido.
create table if not exists public.registration_ticket_items (
  id               uuid primary key default gen_random_uuid(),
  registration_id  uuid not null references public.event_registrations(id) on delete cascade,
  event_id         uuid not null references public.events(id),
  ticket_id        uuid not null references public.event_tickets(id),
  quantity         integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at       timestamptz not null default now(),
  unique (registration_id, ticket_id)
);

create index if not exists registration_ticket_items_registration_idx
  on public.registration_ticket_items using btree (registration_id);
create index if not exists registration_ticket_items_ticket_idx
  on public.registration_ticket_items using btree (ticket_id);

alter table public.registration_ticket_items enable row level security;

drop policy if exists "items: dono le seus" on public.registration_ticket_items;
create policy "items: dono le seus"
  on public.registration_ticket_items for select
  to authenticated
  using (exists (
    select 1 from public.event_registrations r
     where r.id = registration_id and r.user_id = auth.uid()
  ));

drop policy if exists "items: admin do evento le" on public.registration_ticket_items;
create policy "items: admin do evento le"
  on public.registration_ticket_items for select
  to authenticated
  using (public.is_event_org_admin(event_id));

-- 2. Troca de índices em ticket_reservations.
drop index if exists public.ticket_reservations_active_uniq;
drop index if exists public.ticket_reservations_one_hold_per_user_event;

create unique index if not exists ticket_reservations_one_hold_per_registration_ticket
  on public.ticket_reservations using btree (registration_id, ticket_id)
  where (status = 'held');

-- Guard de "1 pedido em aberto por pessoa/evento" migra pra cá.
create unique index if not exists registrations_one_pending_per_user_event
  on public.event_registrations using btree (user_id, event_id)
  where (status = 'pending');

-- 3. reserve_ticket_items: substitui reserve_ticket_sold nos novos callers.
-- reserve_ticket_sold NÃO é tocada (stripe-checkout legado continua usando).
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

-- 4a. confirm_ticket_reservation: de "1 linha" pra "todas as linhas held do pedido".
create or replace function public.confirm_ticket_reservation(p_registration_id uuid)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_rec        record;
  v_any_found  boolean := false;
  v_still_held integer;
  v_statuses   text[];
begin
  for v_rec in
    update public.ticket_reservations
       set status = 'confirmed', resolved_at = now()
     where registration_id = p_registration_id
       and status = 'held'
    returning ticket_id, quantity
  loop
    v_any_found := true;
    if v_rec.ticket_id is not null then
      update public.event_tickets
         set reserved = greatest(0, coalesce(reserved, 0) - v_rec.quantity),
             sold     = coalesce(sold, 0) + v_rec.quantity
       where id = v_rec.ticket_id;
    end if;
  end loop;

  if v_any_found then
    select count(*) into v_still_held
      from public.ticket_reservations
     where registration_id = p_registration_id and status = 'held';
    if v_still_held > 0 then
      return 'PARTIAL';
    end if;
    return 'CONFIRMED';
  end if;

  select array_agg(distinct status) into v_statuses
    from public.ticket_reservations
   where registration_id = p_registration_id;

  if v_statuses is null then
    return 'NOT_FOUND';
  elsif v_statuses = array['confirmed'] then
    return 'ALREADY_CONFIRMED';
  elsif 'released' = any(v_statuses) and not ('held' = any(v_statuses)) then
    return 'RELEASED';
  else
    return 'NOT_FOUND';
  end if;
end;
$function$;

-- 4b. release_ticket_reservation: mesma troca, libera todas as linhas held do pedido.
create or replace function public.release_ticket_reservation(p_registration_id uuid)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_rec       record;
  v_any_found boolean := false;
begin
  for v_rec in
    update public.ticket_reservations
       set status = 'released', resolved_at = now()
     where registration_id = p_registration_id
       and status = 'held'
    returning ticket_id, quantity, event_id, options_reserved, selections
  loop
    v_any_found := true;
    if v_rec.ticket_id is not null then
      update public.event_tickets
         set reserved = greatest(0, coalesce(reserved, 0) - v_rec.quantity)
       where id = v_rec.ticket_id;
    end if;
    if v_rec.options_reserved then
      perform public.release_option_counts(v_rec.event_id, v_rec.selections);
    end if;
  end loop;

  return v_any_found;
end;
$function$;

-- 4c. release_ticket_hold: chamada pelos DOIS TRIGGERS de
-- event_registrations (cancel e delete) com o ticket_id LEGADO singular.
-- Com carrinho multi-tipo esse ticket_id só representa 1 dos N itens do
-- pedido — se filtrássemos por ele (como uma correção mais ingênua faria),
-- cancelar um pedido com 3 tipos devolveria sold de apenas 1 deles.
-- Correção real: IGNORAR p_ticket_id (mantido só pela assinatura, que os
-- triggers chamam sem mudança) e liberar TODAS as reservas 'confirmed'
-- do registration_id, uma por tipo.
create or replace function public.release_ticket_hold(p_registration_id uuid, p_ticket_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_rec record;
begin
  for v_rec in
    update public.ticket_reservations
       set status = 'released', resolved_at = now()
     where registration_id = p_registration_id
       and status = 'confirmed'
    returning ticket_id, quantity
  loop
    if v_rec.ticket_id is not null then
      update public.event_tickets
         set sold = greatest(coalesce(sold, 0) - coalesce(v_rec.quantity, 1), 0)
       where id = v_rec.ticket_id;
    end if;
  end loop;
end;
$function$;

-- Remove a assinatura antiga (10 parâmetros) ANTES do CREATE OR REPLACE.
-- Sem isso, adicionar p_items cria uma SEGUNDA função por overload em vez
-- de substituir — foi o que aconteceu ao aplicar isso pela primeira vez
-- em produção: duas create_free_registration convivendo, a nova exposta
-- a anon/authenticated pelo ALTER DEFAULT PRIVILEGES do projeto, e risco
-- de "function is not unique" no frontend por ambiguidade de overload.
drop function if exists public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text
);

-- 5. create_free_registration: ganha p_items, mantém p_ticket_id legado.
create or replace function public.create_free_registration(
  p_event_id       uuid,
  p_ticket_id      uuid default null::uuid,
  p_full_name      text default ''::text,
  p_email          text default ''::text,
  p_cpf            text default null::text,
  p_phone          text default null::text,
  p_birth_date     date default null::date,
  p_custom_fields  jsonb default '{}'::jsonb,
  p_selections     jsonb default '[]'::jsonb,
  p_coupon_code    text default null::text,
  p_items          jsonb default null::jsonb
)
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
  v_item           record;
  v_main_ticket    uuid;
  v_has_items      boolean := jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 0;
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

  v_efetivo := 0;

  if v_has_items then
    for v_item in
      select (elem->>'ticket_id')::uuid as ticket_id,
             (elem->>'quantity')::integer as quantity
        from jsonb_array_elements(p_items) as elem
    loop
      select t.price_cents, t.sales_start_at, t.sales_end_at
        into v_price, v_sales_start, v_sales_end
        from public.event_tickets t
       where t.id = v_item.ticket_id and t.event_id = p_event_id;
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
      v_efetivo := v_efetivo + (coalesce(v_price, 0) * v_item.quantity);
    end loop;

    select (elem->>'ticket_id')::uuid into v_main_ticket
      from jsonb_array_elements(p_items) as elem
     order by (elem->>'quantity')::integer *
              (select price_cents from public.event_tickets where id = (elem->>'ticket_id')::uuid) desc
     limit 1;
  elsif p_ticket_id is not null then
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
    v_efetivo := coalesce(v_price, 0);
    v_main_ticket := p_ticket_id;
  end if;

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
    (p_event_id, v_main_ticket, v_uid, p_full_name, p_email, p_cpf, p_phone,
     p_birth_date, coalesce(p_custom_fields, '{}'::jsonb), v_coupon_id, 'confirmed')
  returning * into v_reg;

  if v_has_items then
    perform public.reserve_ticket_items(
      p_registration_id  => v_reg.id,
      p_event_id         => p_event_id,
      p_items            => p_items,
      p_options_reserved => jsonb_array_length(coalesce(p_selections, '[]'::jsonb)) > 0,
      p_selections        => coalesce(p_selections, '[]'::jsonb)
    );
    v_confirm_result := public.confirm_ticket_reservation(v_reg.id);
    if v_confirm_result <> 'CONFIRMED' then
      raise exception 'RESERVATION_LOST' using errcode = 'P0001';
    end if;
  elsif p_ticket_id is not null then
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

-- 6. ACL de reserve_ticket_items: função nova, só o backend chama (mesmo
-- perfil de reserve_ticket_sold, 031). Sem isto o Supabase concede EXECUTE
-- a anon/authenticated por padrão (ALTER DEFAULT PRIVILEGES do projeto,
-- documentado em 041) e qualquer chamador manipula `reserved` direto.
revoke all on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) from public;
grant execute on function public.reserve_ticket_items(uuid, uuid, jsonb, boolean, jsonb) to service_role;

-- 7. ACL de create_free_registration: perfil igual à versão anterior
-- (authenticated, sem anon/public) — CREATE OR REPLACE preserva ACL de
-- função existente, mas o DROP acima + CREATE seguinte recria do zero,
-- então precisa reafirmar explicitamente.
revoke all on function public.create_free_registration(uuid, uuid, text, text, text, text, date, jsonb, jsonb, text, jsonb) from public;
revoke all on function public.create_free_registration(uuid, uuid, text, text, text, text, date, jsonb, jsonb, text, jsonb) from anon;
grant execute on function public.create_free_registration(uuid, uuid, text, text, text, text, date, jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function public.create_free_registration(uuid, uuid, text, text, text, text, date, jsonb, jsonb, text, jsonb) to service_role;
