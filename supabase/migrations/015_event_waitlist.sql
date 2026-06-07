-- ============================================================
--  015_event_waitlist.sql
--  Fila de espera de eventos (waitlist).
--  ADITIVO: nova tabela + índices + RLS + RPCs. Não altera
--  tabelas/policies existentes.
-- ============================================================

create table public.event_waitlist (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  ticket_type_id  uuid        references public.event_tickets(id) on delete cascade,
  position        integer     not null,
  status          text        not null default 'waiting'
                    check (status in ('waiting', 'notified', 'expired', 'converted')),
  notified_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_waitlist_event_pos_idx on public.event_waitlist (event_id, position);
create index event_waitlist_user_idx       on public.event_waitlist (user_id);
create index event_waitlist_status_idx     on public.event_waitlist (status, notified_at);

alter table public.event_waitlist enable row level security;

-- SELECT: dono da entrada, admin da org do evento ou platform admin.
create policy "event_waitlist: dono/org/admin lê"
  on public.event_waitlist for select
  using (
    user_id = auth.uid()
    or public.is_event_org_admin(event_id)
    or public.is_platform_admin()
  );

-- INSERT: qualquer usuário autenticado (posição é calculada pela RPC).
create policy "event_waitlist: autenticado entra"
  on public.event_waitlist for insert
  with check (auth.uid() is not null);

-- UPDATE: somente admin da org ou platform admin (notificar/expirar/converter).
create policy "event_waitlist: org/admin atualiza"
  on public.event_waitlist for update
  using  (public.is_event_org_admin(event_id) or public.is_platform_admin())
  with check (public.is_event_org_admin(event_id) or public.is_platform_admin());

-- DELETE: dono da entrada ou platform admin.
create policy "event_waitlist: dono/admin remove"
  on public.event_waitlist for delete
  using (user_id = auth.uid() or public.is_platform_admin());

-- ─── RPC: entrar na fila (posição atômica) ──────────────────
create or replace function public.waitlist_join(
  p_event_id       uuid,
  p_ticket_type_id uuid default null
)
returns public.event_waitlist
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_pos integer;
  v_row public.event_waitlist;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if exists (
    select 1 from public.event_registrations r
    where r.event_id = p_event_id
      and r.user_id = v_uid
      and r.status <> 'cancelled'
  ) then
    raise exception 'Você já está inscrito neste evento';
  end if;

  select coalesce(max(position), 0) + 1
    into v_pos
    from public.event_waitlist
   where event_id = p_event_id;

  insert into public.event_waitlist (event_id, user_id, ticket_type_id, position)
  values (p_event_id, v_uid, p_ticket_type_id, v_pos)
  returning * into v_row;

  return v_row;
exception
  when unique_violation then
    raise exception 'Você já está na fila de espera deste evento';
end;
$$;

-- ─── RPC: sair da fila (recalcula posições) ─────────────────
create or replace function public.waitlist_leave(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_event uuid;
  v_pos   integer;
  v_owner uuid;
begin
  select event_id, position, user_id
    into v_event, v_pos, v_owner
    from public.event_waitlist
   where id = p_id;

  if v_event is null then
    return;
  end if;

  if v_owner <> v_uid and not public.is_platform_admin() then
    raise exception 'Sem permissão para remover esta entrada';
  end if;

  delete from public.event_waitlist where id = p_id;

  update public.event_waitlist
     set position = position - 1
   where event_id = v_event
     and position > v_pos;
end;
$$;

-- ─── RPC: notificar o próximo da fila (organizador/admin) ────
create or replace function public.waitlist_notify_next(p_event_id uuid)
returns public.event_waitlist
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.event_waitlist;
begin
  if not (public.is_event_org_admin(p_event_id) or public.is_platform_admin()) then
    raise exception 'Sem permissão';
  end if;

  select *
    into v_row
    from public.event_waitlist
   where event_id = p_event_id
     and status = 'waiting'
   order by position asc
   limit 1;

  if v_row.id is null then
    raise exception 'Não há ninguém aguardando na fila';
  end if;

  update public.event_waitlist
     set status = 'notified',
         notified_at = now(),
         expires_at = now() + interval '48 hours'
   where id = v_row.id
  returning * into v_row;

  return v_row;
end;
$$;

-- ─── RPC: fila do evento com nome/e-mail (organizador/admin) ─
-- profiles não guarda e-mail e organizador não lê auth.users —
-- esta função security-definer resolve nome + e-mail para o painel.
create or replace function public.get_event_waitlist(p_event_id uuid)
returns table (
  id              uuid,
  event_id        uuid,
  user_id         uuid,
  ticket_type_id  uuid,
  "position"      integer,
  status          text,
  notified_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz,
  user_name       text,
  user_email      text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (public.is_event_org_admin(p_event_id) or public.is_platform_admin()) then
    raise exception 'Sem permissão';
  end if;

  return query
    select w.id, w.event_id, w.user_id, w.ticket_type_id, w.position, w.status,
           w.notified_at, w.expires_at, w.created_at,
           p.name, u.email::text
      from public.event_waitlist w
      left join public.profiles p on p.id = w.user_id
      left join auth.users u on u.id = w.user_id
     where w.event_id = p_event_id
     order by w.position asc;
end;
$$;

revoke all on function public.waitlist_join(uuid, uuid) from public;
revoke all on function public.waitlist_leave(uuid) from public;
revoke all on function public.waitlist_notify_next(uuid) from public;
revoke all on function public.get_event_waitlist(uuid) from public;
grant execute on function public.waitlist_join(uuid, uuid) to authenticated;
grant execute on function public.waitlist_leave(uuid) to authenticated;
grant execute on function public.waitlist_notify_next(uuid) to authenticated;
grant execute on function public.get_event_waitlist(uuid) to authenticated;
