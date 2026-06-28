-- ============================================================
--  020_organizations_owner_select.sql
--  Corrige RLS no read-back de INSERT ... RETURNING (supabase-js
--  .insert().select()) ao criar organização.
--
--  Causa: o RETURNING aplica a policy de SELECT à linha criada.
--  As policies de SELECT existentes só permitiam:
--   - membro (id in user_org_ids()) — mas user_org_ids() é STABLE e
--     não enxerga, no mesmo statement, o membro que o trigger
--     AFTER INSERT acabou de inserir → read-back falha;
--   - is_platform_admin() — por isso SÓ superadmins conseguiam criar.
--
--  Correção: o dono sempre lê a própria org diretamente (sem depender
--  do timing de organization_members). Aditiva — NÃO altera nenhuma
--  policy existente (INSERT/SELECT/UPDATE/DELETE permanecem como estão).
-- ============================================================

create policy "organizations: dono lê"
  on public.organizations for select
  using (owner_id = auth.uid());
