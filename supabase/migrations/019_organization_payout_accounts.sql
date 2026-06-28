-- ============================================================
--  019_organization_payout_accounts.sql
--  Contas de repasse (PIX ou bancária) cadastradas pelo organizador.
--  Reutilizáveis para pré-preencher solicitações de repasse.
--
--  ADITIVO: nova tabela + RLS própria. Não altera tabelas/policies
--  existentes. Dados sensíveis (CPF/CNPJ, conta, chave PIX) ficam
--  íntegros no banco; o mascaramento é responsabilidade da UI.
-- ============================================================

create table public.organization_payout_accounts (
  id                uuid        primary key default gen_random_uuid(),
  organization_id   uuid        not null references public.organizations(id) on delete cascade,
  label             text,                       -- apelido opcional ("Conta principal")
  account_kind      text        not null check (account_kind in ('pix', 'bank')),
  holder_name       text        not null,       -- titular
  holder_document   text        not null,       -- CPF/CNPJ do titular
  -- PIX (quando account_kind = 'pix')
  pix_key_type      text        check (pix_key_type in ('cpf', 'cnpj', 'email', 'phone', 'random')),
  pix_key           text,
  -- Bancária (quando account_kind = 'bank')
  bank_code         text,                        -- código do banco (ex: 001, 260, 077)
  bank_name         text,
  bank_agency       text,
  bank_account      text,
  bank_account_type text        check (bank_account_type in ('corrente', 'poupanca')),
  is_default        boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Campos obrigatórios conforme o tipo da conta.
  constraint payout_kind_fields check (
    (account_kind = 'pix'
       and pix_key_type is not null and pix_key is not null)
    or
    (account_kind = 'bank'
       and bank_code is not null and bank_name is not null
       and bank_agency is not null and bank_account is not null
       and bank_account_type is not null)
  )
);

create index organization_payout_accounts_org_idx
  on public.organization_payout_accounts(organization_id);

alter table public.organization_payout_accounts enable row level security;

-- SELECT: owner/admin da própria org OU platform admin (consistente com withdrawal_requests).
create policy "payout_accounts: org admin lê"
  on public.organization_payout_accounts for select
  using (
    organization_id in (select public.user_admin_org_ids())
    or public.is_platform_admin()
  );

-- INSERT/UPDATE/DELETE: somente owner/admin da própria org.
create policy "payout_accounts: org admin insere"
  on public.organization_payout_accounts for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "payout_accounts: org admin atualiza"
  on public.organization_payout_accounts for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "payout_accounts: org admin deleta"
  on public.organization_payout_accounts for delete
  using (organization_id in (select public.user_admin_org_ids()));

create trigger organization_payout_accounts_set_updated_at
  before update on public.organization_payout_accounts
  for each row execute procedure public.set_updated_at();
