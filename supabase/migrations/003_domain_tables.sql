-- ============================================================
--  003_domain_tables.sql
--  Tabelas de domínio do Guardião Eventos + RLS hardening.
--  Cobre B7 da auditoria 2026-05-24.
-- ============================================================

-- ─── ENUMS ──────────────────────────────────────────────────

create type public.event_visibility as enum ('public', 'private');
create type public.event_status     as enum ('draft', 'active', 'paused', 'archived');
create type public.event_format     as enum ('presencial', 'online', 'hibrido');
create type public.ticket_type      as enum ('pago', 'gratuito');
create type public.registration_status as enum ('pending', 'confirmed', 'cancelled', 'waitlist');
create type public.payment_status   as enum ('pending', 'paid', 'refunded', 'failed', 'cancelled');
create type public.payment_method   as enum ('credit_card', 'pix', 'boleto', 'free');
create type public.discount_kind    as enum ('percent', 'fixed');
create type public.message_channel  as enum ('email', 'whatsapp', 'system');

-- ─── HELPER FUNCTIONS (RLS) ─────────────────────────────────

-- Retorna IDs das orgs onde o usuário corrente é owner ou admin.
create or replace function public.user_admin_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select organization_id
  from   public.organization_members
  where  user_id = auth.uid()
    and  role in ('owner', 'admin')
$$;

-- True se o usuário corrente é owner/admin da org dona do evento.
create or replace function public.is_event_org_admin(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from   public.events e
    join   public.organization_members m
      on   m.organization_id = e.organization_id
    where  e.id = p_event_id
      and  m.user_id = auth.uid()
      and  m.role in ('owner', 'admin')
  )
$$;

-- True se o evento é público e está ativo (visível na landing/explore).
create or replace function public.event_is_public_active(p_event_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from   public.events e
    where  e.id = p_event_id
      and  e.visibility = 'public'
      and  e.status = 'active'
  )
$$;

-- ─── EVENTS ─────────────────────────────────────────────────

create table public.events (
  id              uuid                    primary key default uuid_generate_v4(),
  organization_id uuid                    not null references public.organizations(id) on delete cascade,
  created_by      uuid                    references public.profiles(id) on delete set null,
  name            text                    not null,
  slug            text                    not null unique,
  description     text,
  description_text text,
  banner_url      text,
  category        text,
  format          public.event_format     not null default 'presencial',
  visibility      public.event_visibility not null default 'public',
  status          public.event_status     not null default 'draft',
  start_at        timestamptz,
  end_at          timestamptz,
  location        jsonb,
  custom_fields   jsonb                   not null default '[]'::jsonb,
  show_fields     jsonb                   not null default '{}'::jsonb,
  created_at      timestamptz             not null default now(),
  updated_at      timestamptz             not null default now()
);

create index events_org_idx       on public.events(organization_id);
create index events_visibility_idx on public.events(visibility, status);
create index events_start_idx     on public.events(start_at);

alter table public.events enable row level security;

create policy "events: público vê eventos ativos"
  on public.events for select
  using (
    (visibility = 'public' and status = 'active')
    or organization_id in (select public.user_admin_org_ids())
  );

create policy "events: admin/owner cria"
  on public.events for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "events: admin/owner atualiza sem mover org"
  on public.events for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "events: admin/owner deleta"
  on public.events for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ─── EVENT_TICKETS ──────────────────────────────────────────

create table public.event_tickets (
  id              uuid               primary key default uuid_generate_v4(),
  event_id        uuid               not null references public.events(id) on delete cascade,
  name            text               not null,
  type            public.ticket_type not null default 'pago',
  price_cents     integer            not null default 0 check (price_cents >= 0),
  quantity        integer            not null default 0 check (quantity >= 0),
  sold            integer            not null default 0 check (sold >= 0),
  visibility      public.event_visibility not null default 'public',
  status          text               not null default 'active',
  pass_fees       boolean            not null default false,
  sort_order      integer            not null default 0,
  created_at      timestamptz        not null default now(),
  updated_at      timestamptz        not null default now()
);

create index event_tickets_event_idx on public.event_tickets(event_id);

alter table public.event_tickets enable row level security;

create policy "tickets: visíveis com o evento"
  on public.event_tickets for select
  using (
    public.event_is_public_active(event_id)
    or public.is_event_org_admin(event_id)
  );

create policy "tickets: admin gerencia (insert)"
  on public.event_tickets for insert
  with check (public.is_event_org_admin(event_id));

create policy "tickets: admin gerencia (update)"
  on public.event_tickets for update
  using  (public.is_event_org_admin(event_id))
  with check (public.is_event_org_admin(event_id));

create policy "tickets: admin gerencia (delete)"
  on public.event_tickets for delete
  using (public.is_event_org_admin(event_id));

-- ─── EVENT_REGISTRATIONS (PII) ──────────────────────────────

create table public.event_registrations (
  id              uuid                          primary key default uuid_generate_v4(),
  event_id        uuid                          not null references public.events(id) on delete cascade,
  ticket_id       uuid                          references public.event_tickets(id) on delete set null,
  user_id         uuid                          references public.profiles(id) on delete set null,
  full_name       text                          not null,
  email           text                          not null,
  cpf             text,
  phone           text,
  birth_date      date,
  custom_fields   jsonb                         not null default '{}'::jsonb,
  status          public.registration_status    not null default 'pending',
  registered_at   timestamptz                   not null default now(),
  updated_at      timestamptz                   not null default now()
);

create index registrations_event_idx on public.event_registrations(event_id);
create index registrations_user_idx  on public.event_registrations(user_id);
create index registrations_email_idx on public.event_registrations(event_id, lower(email));

alter table public.event_registrations enable row level security;

create policy "registrations: dono vê própria"
  on public.event_registrations for select
  using (
    user_id = auth.uid()
    or public.is_event_org_admin(event_id)
  );

-- Participante autenticado se inscreve em evento público+ativo, OU admin inscreve manualmente.
create policy "registrations: auto-inscrição em evento público OR admin"
  on public.event_registrations for insert
  with check (
    (
      user_id = auth.uid()
      and public.event_is_public_active(event_id)
    )
    or public.is_event_org_admin(event_id)
  );

-- Participante pode atualizar apenas a própria inscrição (campos editáveis no app).
-- Admin tem poder total dentro da org dona.
create policy "registrations: dono ou admin atualiza"
  on public.event_registrations for update
  using (
    user_id = auth.uid()
    or public.is_event_org_admin(event_id)
  )
  with check (
    user_id = auth.uid()
    or public.is_event_org_admin(event_id)
  );

create policy "registrations: admin deleta"
  on public.event_registrations for delete
  using (public.is_event_org_admin(event_id));

-- ─── CHECKIN_TYPES ──────────────────────────────────────────

create table public.checkin_types (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  event_id        uuid        references public.events(id) on delete cascade,
  name            text        not null,
  description     text,
  active          boolean     not null default true,
  created_at      timestamptz not null default now()
);

create index checkin_types_event_idx on public.checkin_types(event_id);
create index checkin_types_org_idx   on public.checkin_types(organization_id);

alter table public.checkin_types enable row level security;

create policy "checkin_types: membros leem"
  on public.checkin_types for select
  using (organization_id in (select public.user_org_ids()));

create policy "checkin_types: admin gerencia (insert)"
  on public.checkin_types for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "checkin_types: admin gerencia (update)"
  on public.checkin_types for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "checkin_types: admin gerencia (delete)"
  on public.checkin_types for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ─── CHECKINS (PII via registration) ────────────────────────

create table public.checkins (
  id                uuid        primary key default uuid_generate_v4(),
  event_id          uuid        not null references public.events(id) on delete cascade,
  registration_id   uuid        not null references public.event_registrations(id) on delete cascade,
  checkin_type_id   uuid        references public.checkin_types(id) on delete set null,
  performed_by      uuid        references public.profiles(id) on delete set null,
  checked_at        timestamptz not null default now(),
  notes             text,
  unique (registration_id, checkin_type_id)
);

create index checkins_event_idx        on public.checkins(event_id);
create index checkins_registration_idx on public.checkins(registration_id);

alter table public.checkins enable row level security;

-- Dono da inscrição vê próprio checkin; admin da org dona vê todos.
create policy "checkins: dono ou admin lê"
  on public.checkins for select
  using (
    public.is_event_org_admin(event_id)
    or exists (
      select 1
      from   public.event_registrations r
      where  r.id = checkins.registration_id
        and  r.user_id = auth.uid()
    )
  );

create policy "checkins: admin registra"
  on public.checkins for insert
  with check (public.is_event_org_admin(event_id));

create policy "checkins: admin atualiza"
  on public.checkins for update
  using  (public.is_event_org_admin(event_id))
  with check (public.is_event_org_admin(event_id));

create policy "checkins: admin deleta"
  on public.checkins for delete
  using (public.is_event_org_admin(event_id));

-- ─── COUPONS ────────────────────────────────────────────────

create table public.coupons (
  id              uuid                primary key default uuid_generate_v4(),
  organization_id uuid                not null references public.organizations(id) on delete cascade,
  event_id        uuid                references public.events(id) on delete cascade,
  code            text                not null,
  discount_kind   public.discount_kind not null,
  discount_value  numeric(12,2)       not null check (discount_value >= 0),
  max_uses        integer             check (max_uses is null or max_uses > 0),
  used_count      integer             not null default 0 check (used_count >= 0),
  starts_at       timestamptz,
  expires_at      timestamptz,
  active          boolean             not null default true,
  created_at      timestamptz         not null default now(),
  unique (organization_id, code)
);

create index coupons_event_idx on public.coupons(event_id);

alter table public.coupons enable row level security;

-- Cupons NÃO são públicos: validação pública deve ser feita via RPC security-definer
-- que retorna apenas {valid, discount} sem expor a tabela inteira.
create policy "coupons: membros leem"
  on public.coupons for select
  using (organization_id in (select public.user_org_ids()));

create policy "coupons: admin gerencia (insert)"
  on public.coupons for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "coupons: admin gerencia (update)"
  on public.coupons for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "coupons: admin gerencia (delete)"
  on public.coupons for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ─── EVENT_MESSAGES ─────────────────────────────────────────

create table public.event_messages (
  id              uuid                  primary key default uuid_generate_v4(),
  organization_id uuid                  not null references public.organizations(id) on delete cascade,
  event_id        uuid                  references public.events(id) on delete cascade,
  created_by      uuid                  references public.profiles(id) on delete set null,
  channel         public.message_channel not null default 'system',
  subject         text,
  body            text                  not null,
  audience        jsonb                 not null default '{}'::jsonb,
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_at      timestamptz           not null default now()
);

create index event_messages_event_idx on public.event_messages(event_id);

alter table public.event_messages enable row level security;

create policy "messages: membros leem"
  on public.event_messages for select
  using (organization_id in (select public.user_org_ids()));

create policy "messages: admin gerencia (insert)"
  on public.event_messages for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "messages: admin gerencia (update)"
  on public.event_messages for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "messages: admin gerencia (delete)"
  on public.event_messages for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ─── CRM_CONTACTS ───────────────────────────────────────────

create table public.crm_contacts (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  full_name       text        not null,
  email           text,
  phone           text,
  cpf             text,
  tags            jsonb       not null default '[]'::jsonb,
  source          text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index crm_contacts_org_idx   on public.crm_contacts(organization_id);
create index crm_contacts_email_idx on public.crm_contacts(organization_id, lower(email));

alter table public.crm_contacts enable row level security;

create policy "crm: membros leem"
  on public.crm_contacts for select
  using (organization_id in (select public.user_org_ids()));

create policy "crm: admin gerencia (insert)"
  on public.crm_contacts for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm: admin gerencia (update)"
  on public.crm_contacts for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm: admin gerencia (delete)"
  on public.crm_contacts for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ─── PAYMENTS (Financeiro — segurança máxima) ───────────────
-- Mutações exclusivas do service_role (Edge Function / webhook do gateway).
-- Clientes autenticados apenas leem (admin/owner da org).

create table public.payments (
  id                       uuid                  primary key default uuid_generate_v4(),
  organization_id          uuid                  not null references public.organizations(id) on delete restrict,
  event_id                 uuid                  references public.events(id) on delete set null,
  registration_id          uuid                  references public.event_registrations(id) on delete set null,
  coupon_id                uuid                  references public.coupons(id) on delete set null,
  amount_cents             integer               not null check (amount_cents >= 0),
  fee_cents                integer               not null default 0 check (fee_cents >= 0),
  net_cents                integer               not null default 0,
  currency                 text                  not null default 'BRL',
  method                   public.payment_method not null,
  status                   public.payment_status not null default 'pending',
  gateway                  text,
  gateway_transaction_id   text                  unique,
  gateway_payload          jsonb,
  paid_at                  timestamptz,
  refunded_at              timestamptz,
  created_at               timestamptz           not null default now(),
  updated_at               timestamptz           not null default now()
);

create index payments_org_idx          on public.payments(organization_id);
create index payments_event_idx        on public.payments(event_id);
create index payments_registration_idx on public.payments(registration_id);
create index payments_status_idx       on public.payments(status);

alter table public.payments enable row level security;

-- SELECT: somente owner/admin da org dona.
create policy "payments: admin da org lê"
  on public.payments for select
  using (organization_id in (select public.user_admin_org_ids()));

-- INSERT/UPDATE/DELETE: NENHUMA policy para roles authenticated/anon.
-- service_role bypassa RLS por padrão (Supabase) → único caminho de mutação.
-- Default-deny garante que nem mesmo um admin do app possa alterar valores manualmente.

-- ─── TRIGGERS: updated_at automático ────────────────────────

create trigger events_set_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

create trigger event_tickets_set_updated_at
  before update on public.event_tickets
  for each row execute procedure public.set_updated_at();

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute procedure public.set_updated_at();

create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row execute procedure public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

-- ─── NET_CENTS automático em payments ───────────────────────

create or replace function public.payments_compute_net()
returns trigger
language plpgsql
as $$
begin
  new.net_cents := greatest(new.amount_cents - new.fee_cents, 0);
  return new;
end;
$$;

create trigger payments_compute_net_bi
  before insert or update of amount_cents, fee_cents on public.payments
  for each row execute procedure public.payments_compute_net();

-- ─── RPC PÚBLICA: validação de cupom sem expor tabela ───────
-- Permite que checkout (anônimo ou autenticado) valide um código sem
-- consultar coupons diretamente — protege contra enumeração.

create or replace function public.validate_coupon(
  p_event_id uuid,
  p_code     text
)
returns table (
  valid          boolean,
  discount_kind  public.discount_kind,
  discount_value numeric
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    (c.id is not null
     and c.active
     and (c.starts_at is null or c.starts_at <= now())
     and (c.expires_at is null or c.expires_at >  now())
     and (c.max_uses  is null or c.used_count < c.max_uses)
    ) as valid,
    c.discount_kind,
    c.discount_value
  from public.events e
  left join public.coupons c
    on  upper(c.code) = upper(p_code)
    and (c.event_id = e.id or (c.event_id is null and c.organization_id = e.organization_id))
  where e.id = p_event_id
  limit 1
$$;

revoke all on function public.validate_coupon(uuid, text) from public;
grant execute on function public.validate_coupon(uuid, text) to anon, authenticated;
