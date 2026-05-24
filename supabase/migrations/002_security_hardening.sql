-- ============================================================
--  002_security_hardening.sql
--  Endurecimento de RLS + correção de brechas de bootstrap.
--  Auditoria 2026-05-24.
-- ============================================================

-- ─── B2 / B6: PROFILES — permitir leitura pública de campos não-sensíveis ──
-- App exibe nome/avatar de organizadores. Mantém UPDATE/DELETE restritos.
drop policy if exists "profiles: leitura própria" on public.profiles;

create policy "profiles: leitura pública (nome/avatar)"
  on public.profiles for select
  using (true);

-- INSERT manual bloqueado: trigger handle_new_user (security definer) faz a inserção.
-- Mantemos default-deny para INSERT/DELETE.

-- ─── B2: ORGANIZATIONS SELECT — owner também enxerga, mesmo sem entry em members ──
drop policy if exists "organizations: membros podem ler" on public.organizations;

create policy "organizations: owner ou membro pode ler"
  on public.organizations for select
  using (
    owner_id = auth.uid()
    or id in (select public.user_org_ids())
  );

-- ─── B3: ORGANIZATIONS UPDATE — bloquear troca de owner_id ──
drop policy if exists "organizations: proprietário pode atualizar" on public.organizations;

create policy "organizations: owner atualiza sem trocar owner_id"
  on public.organizations for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ─── B1 + B4: ORGANIZATION_MEMBERS — permitir bootstrap do owner ──
-- Cenário fix: ao criar uma organização, o owner consegue se auto-inserir
-- como 'owner' em organization_members. Demais inserções continuam exigindo
-- owner/admin pré-existente.
drop policy if exists "org_members: owner/admin podem adicionar" on public.organization_members;

create policy "org_members: owner se auto-insere ou admin adiciona"
  on public.organization_members for insert
  with check (
    -- Caso bootstrap: usuário é dono da organização e está se adicionando como 'owner'.
    (
      user_id = auth.uid()
      and role = 'owner'
      and exists (
        select 1
        from public.organizations o
        where o.id = organization_members.organization_id
          and o.owner_id = auth.uid()
      )
    )
    -- Caso normal: já existe owner/admin que pode adicionar outros.
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- B4: UPDATE precisa de WITH CHECK pra impedir cross-org leak e lockout.
drop policy if exists "org_members: owner/admin podem alterar papel" on public.organization_members;

create policy "org_members: owner/admin altera papel sem mover escopo"
  on public.organization_members for update
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    -- Não permite mover membro para outra organização.
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = organization_members.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- ─── B5: PROJECTS UPDATE — impedir mover project pra outra org ──
drop policy if exists "projects: owner/admin podem atualizar" on public.projects;

create policy "projects: owner/admin atualiza sem mover org"
  on public.projects for update
  using (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members m
      where m.organization_id = projects.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- ─── Trigger: ao criar org, registrar owner em organization_members ──
-- Resolve B1 de forma automática + defensiva. Mesmo que cliente esqueça
-- de chamar insert em organization_members, o vínculo é criado.
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

drop trigger if exists on_organization_created on public.organizations;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute procedure public.handle_new_organization();

-- ============================================================
--  PENDÊNCIA DE SCHEMA (B7) — não corrigido nesta migration.
-- ============================================================
-- Tabelas do domínio do app ainda inexistentes:
--   events, event_tickets, event_registrations, event_participants,
--   checkin_types, checkins, coupons, payments, event_messages,
--   waiting_list, crm_contacts, organizadores.
--
-- Hoje persistidas em localStorage do cliente. Antes de produção
-- com Supabase real, criar migration 003 com:
--   - DDL das tabelas
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY
--   - Policies SELECT/INSERT/UPDATE/DELETE amarradas a:
--       * organization_id in (select public.user_org_ids())  -- escopo da org
--       * auth.uid() = participant_user_id                   -- inscrição própria
--       * role in ('owner','admin') em organization_members  -- mutações
--
-- Sem isso, dados sensíveis (PII de participantes, financeiro, cupons)
-- ficam fora de qualquer controle server-side.
