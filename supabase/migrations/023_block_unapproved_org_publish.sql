-- ============================================================
--  023_block_unapproved_org_publish.sql
--  Governança: org NÃO-aprovada não publica evento.
--
--  Regra: se a organização dona não está 'approved', um evento não
--  pode ficar 'active' (público). O status é COAGIDO para 'draft'
--  (coerção, não erro — o evento sempre salva). Vale em INSERT e
--  UPDATE. Admin de plataforma (is_platform_admin) é ISENTO — pode
--  forçar qualquer status (moderação intacta).
--
--  ADITIVO: apenas CREATE FUNCTION + CREATE TRIGGER. NÃO recria
--  tabelas, NÃO altera policies/RLS existentes, NÃO mexe no enum.
--  Linhas já existentes não são tocadas (trigger só roda em
--  INSERT/UPDATE novo) → eventos de orgs já approved seguem intactos.
-- ============================================================

-- Helper: a organização está aprovada?
create or replace function public.is_org_approved(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organizations
    where id = p_org_id and status = 'approved'
  );
$$;

revoke all on function public.is_org_approved(uuid) from public;
grant execute on function public.is_org_approved(uuid) to anon, authenticated, service_role;

-- Trigger: coage 'active' → 'draft' quando a org dona não está aprovada.
create or replace function public.enforce_org_approved_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'active'
     and not public.is_org_approved(NEW.organization_id)
     and not public.is_platform_admin()
  then
    NEW.status := 'draft';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_org_approved_publish on public.events;
create trigger trg_enforce_org_approved_publish
  before insert or update on public.events
  for each row
  execute function public.enforce_org_approved_publish();
