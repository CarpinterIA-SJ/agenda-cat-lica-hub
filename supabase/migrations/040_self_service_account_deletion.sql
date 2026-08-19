-- ============================================================
--  040_self_service_account_deletion.sql
--  Suporte a "Excluir minha conta" (LGPD, self-service).
--
--  Estratégia: soft-delete/anonimização, não DELETE físico de auth.users.
--  Motivo: organizations.owner_id → profiles(id) ON DELETE CASCADE e
--  payments.organization_id → organizations(id) ON DELETE RESTRICT — um
--  hard delete em cascata trava (ou apaga dados de terceiros/inscritos)
--  assim que o usuário for dono de uma org com evento/venda. A Edge
--  Function delete-account bloqueia esse caso e direciona ao canal
--  manual já previsto em /privacidade. Quando não há bloqueio, ela:
--    1. apaga organizações vazias (sem evento/pagamento) de que o
--       usuário é owner — cascade cuida do resto (members, projects…);
--    2. remove as demais memberships do usuário em orgs de terceiros;
--    3. anonimiza nome/avatar em profiles e marca deleted_at;
--    4. bane o login via auth.admin.updateUserById (ban_duration).
--  event_registrations/payments/checkins mantêm seus próprios campos
--  (full_name/email/cpf snapshot da inscrição) intocados — é o dado
--  cuja retenção a política de privacidade já reserva por obrigação
--  legal, independente da conta de login existir ou não.
-- ============================================================

alter table public.profiles
  add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  'Marcado quando o usuário exclui a própria conta (self-service). Perfil é anonimizado, não removido — ver 040_self_service_account_deletion.sql.';

create index if not exists profiles_deleted_at_idx
  on public.profiles(deleted_at)
  where deleted_at is not null;
