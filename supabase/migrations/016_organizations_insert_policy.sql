-- ============================================================
--  016_organizations_insert_policy.sql
--  Corrige: "new row violates row-level security policy for
--  table organizations" ao criar organizador/organização.
--
--  Causa: a policy de INSERT definida em 001
--  ("organizations: proprietário pode criar", with check
--  owner_id = auth.uid()) está AUSENTE no banco de produção
--  (drift de schema). As migrations 002–015 nunca a dropam,
--  mas em produção ela não está vigente, então todo INSERT em
--  public.organizations cai no default-deny do RLS.
--
--  Correção: RE-ESTABELECE a policy de INSERT com nome próprio,
--  para NÃO colidir com a policy original (caso ela exista) nem
--  alterar nenhuma outra policy. Policies de INSERT são
--  PERMISSIVAS (combinadas com OR): se a original existir, ambas
--  coexistem sem efeito colateral.
--
--  ADITIVO: apenas CREATE POLICY. Sem ALTER TABLE, sem recriar
--  tabela, sem DROP/ALTER de qualquer policy existente.
-- ============================================================

-- INSERT: usuário autenticado só cria org cujo owner_id é o seu próprio uid.
create policy "organizations: usuário autenticado cria própria org"
  on public.organizations for insert
  to authenticated
  with check (owner_id = auth.uid());
