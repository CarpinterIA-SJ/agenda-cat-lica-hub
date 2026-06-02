-- ============================================================
--  009_fix_org_member_trigger.sql
--  Recria handle_new_organization + trigger on_organization_created
--  e faz backfill dos owners que ficaram sem entrada em
--  organization_members por falha de execução anterior.
-- ============================================================

-- ─── 1. Recria a função ─────────────────────────────────────

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (organization_id, user_id) do nothing;
  return new;
end;
$$;

-- ─── 2. Recria o trigger ─────────────────────────────────────

drop trigger if exists on_organization_created on public.organizations;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_organization();

-- ─── 3. Backfill — owners já existentes sem entrada em members ─

insert into public.organization_members (organization_id, user_id, role)
select o.id, o.owner_id, 'owner'
from   public.organizations o
where  not exists (
  select 1
  from   public.organization_members m
  where  m.organization_id = o.id
  and    m.user_id          = o.owner_id
)
on conflict (organization_id, user_id) do nothing;
