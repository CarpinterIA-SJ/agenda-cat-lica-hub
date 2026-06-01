-- ============================================================
--  008_organizer_approval.sql
--  Aprovação de organizadores (status em organizations) +
--  solicitações de repasse (withdrawal_requests).
--  ADITIVO: não altera migrations 001-007. Apenas ADD COLUMN,
--  novas policies (OR-ed com as existentes) e nova tabela.
-- ============================================================

-- ─── ORGANIZATIONS: colunas de status de aprovação ──────────

alter table public.organizations add column if not exists
  status text not null default 'pending'
  check (status in ('pending', 'approved', 'suspended', 'rejected'));

alter table public.organizations add column if not exists
  status_updated_by uuid references public.profiles(id) on delete set null;

alter table public.organizations add column if not exists
  status_updated_at timestamptz;

alter table public.organizations add column if not exists
  rejection_reason text;

-- ─── ORGANIZATIONS: RLS aditiva p/ platform admin ───────────
-- Admin da plataforma enxerga e modera TODAS as organizações.
-- (políticas OR-ed com as de owner/membro já existentes)

create policy "organizations: platform admin lê todas"
  on public.organizations for select
  using (public.is_platform_admin());

create policy "organizations: platform admin atualiza status"
  on public.organizations for update
  using  (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ─── EVENTS: RLS aditiva p/ platform admin ──────────────────
-- Necessária para contagem de eventos por org (inclui drafts/pausados)
-- e moderação no painel admin.

create policy "events: platform admin lê todos"
  on public.events for select
  using (public.is_platform_admin());

-- ─── WITHDRAWAL_REQUESTS: solicitações de repasse ───────────

create table public.withdrawal_requests (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  requested_by    uuid        references public.profiles(id) on delete set null,
  amount_cents    integer     not null check (amount_cents > 0),
  status          text        not null default 'pending'
                    check (status in ('pending', 'approved', 'paid', 'rejected')),
  bank_name       text,
  bank_agency     text,
  bank_account    text,
  bank_holder     text,
  admin_notes     text,
  reviewed_by     uuid        references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index withdrawal_requests_org_idx    on public.withdrawal_requests(organization_id);
create index withdrawal_requests_status_idx on public.withdrawal_requests(status);

alter table public.withdrawal_requests enable row level security;

-- SELECT: membros da org dona OU platform admin
create policy "withdrawal_requests: org ou admin lê"
  on public.withdrawal_requests for select
  using (
    organization_id in (select public.user_org_ids())
    or public.is_platform_admin()
  );

-- INSERT: somente owner/admin da org pode solicitar repasse
create policy "withdrawal_requests: org admin solicita"
  on public.withdrawal_requests for insert
  with check (organization_id in (select public.user_admin_org_ids()));

-- UPDATE: somente platform admin (aprovar / rejeitar / marcar pago)
create policy "withdrawal_requests: platform admin atualiza"
  on public.withdrawal_requests for update
  using  (public.is_platform_admin())
  with check (public.is_platform_admin());

-- DELETE: somente platform admin
create policy "withdrawal_requests: platform admin deleta"
  on public.withdrawal_requests for delete
  using (public.is_platform_admin());

-- Trigger updated_at
create trigger withdrawal_requests_set_updated_at
  before update on public.withdrawal_requests
  for each row execute procedure public.set_updated_at();
