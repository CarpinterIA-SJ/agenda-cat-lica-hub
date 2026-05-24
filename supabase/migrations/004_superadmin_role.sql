-- ============================================================
--  004_superadmin_role.sql
--  Estrutura segura de roles globais (incluindo superadmin).
--  Princípio: usuário JAMAIS pode se auto-promover.
-- ============================================================

-- ─── ENUM de papéis globais da aplicação ────────────────────

create type public.app_role as enum (
  'superadmin',  -- acesso total à plataforma (Guardião Eventos)
  'admin',       -- staff administrativo
  'support',     -- atendimento, leitura ampla
  'organizer',   -- papel default para usuários que criam eventos
  'participant'  -- papel default para inscritos
);

-- ─── TABELA user_roles (junção segura) ──────────────────────
-- Cada usuário pode acumular múltiplas roles. Usar tabela separada
-- (não coluna em profiles) protege contra escalada via UPDATE de profile.

create table public.user_roles (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  role        public.app_role not null,
  granted_by  uuid        references public.profiles(id) on delete set null,
  granted_at  timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_idx on public.user_roles(user_id);
create index user_roles_role_idx on public.user_roles(role);

alter table public.user_roles enable row level security;

-- ─── HELPER FUNCTIONS (security definer) ────────────────────
-- Importantes para policies não causarem recursão e bypassarem RLS
-- de forma controlada.

create or replace function public.has_role(p_role public.app_role)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from   public.user_roles
    where  user_id = auth.uid()
      and  role    = p_role
  )
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from   public.user_roles
    where  user_id = auth.uid()
      and  role    = 'superadmin'
  )
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from   public.user_roles
    where  user_id = auth.uid()
      and  role in ('superadmin', 'admin')
  )
$$;

-- ─── RLS POLICIES ───────────────────────────────────────────

-- SELECT:
--   * usuário lê apenas as próprias roles
--   * superadmin/admin lê tudo (auditoria, gestão)
create policy "user_roles: self ou platform admin lê"
  on public.user_roles for select
  using (
    user_id = auth.uid()
    or public.is_platform_admin()
  );

-- INSERT:
--   * SOMENTE platform admin pode conceder roles
--   * WITH CHECK garante: o concedente NÃO pode ser o próprio destinatário
--     (impede self-promotion mesmo de admins existentes para a role superadmin)
--   * WITH CHECK garante: granted_by, se informado, é o próprio auth.uid()
create policy "user_roles: somente admin concede (sem self-promo)"
  on public.user_roles for insert
  with check (
    public.is_platform_admin()
    and user_id <> auth.uid()
    and (granted_by is null or granted_by = auth.uid())
  );

-- UPDATE:
--   * SOMENTE platform admin
--   * Não pode mexer na própria entry (anti-escalada)
--   * Não pode mover a entry para outro user_id
create policy "user_roles: admin atualiza terceiros (sem self)"
  on public.user_roles for update
  using (
    public.is_platform_admin()
    and user_id <> auth.uid()
  )
  with check (
    public.is_platform_admin()
    and user_id <> auth.uid()
  );

-- DELETE:
--   * SOMENTE platform admin
--   * Não pode remover a própria entry de superadmin (anti-lockout doloroso
--     e bloqueia tentativa de "rebaixar a si mesmo para promover de novo").
--   * Pra remover própria role, admin precisa pedir a outro admin.
create policy "user_roles: admin revoga terceiros"
  on public.user_roles for delete
  using (
    public.is_platform_admin()
    and user_id <> auth.uid()
  );

-- ─── DEFENSE-IN-DEPTH: trigger anti-escalada de privilégio ──
-- Mesmo que alguém consiga driblar RLS (ex: rota service_role exposta),
-- o trigger barra qualquer auto-atribuição via aplicação cliente.

create or replace function public.user_roles_block_self_grant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  acting uuid;
begin
  acting := auth.uid();

  -- service_role/postgres têm auth.uid() = null e podem operar livre
  -- (necessário para seed inicial e scripts de migração).
  if acting is null then
    return new;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.user_id = acting then
    raise exception 'Auto-promoção de role bloqueada (user=% role=%).',
      new.user_id, new.role
      using errcode = '42501'; -- insufficient_privilege
  end if;

  return new;
end;
$$;

create trigger user_roles_block_self_grant_bi
  before insert or update on public.user_roles
  for each row execute procedure public.user_roles_block_self_grant();

-- ─── BOOTSTRAP do primeiro superadmin ───────────────────────
-- O primeiro superadmin DEVE ser criado manualmente via SQL Editor do
-- Supabase Studio (rodando como postgres/service_role, auth.uid() = null):
--
--   insert into public.user_roles (user_id, role)
--   values ('<uuid-do-usuario-fundador>', 'superadmin');
--
-- A partir daí, novos superadmins/admins são criados por superadmins
-- existentes via o painel da aplicação (sujeito a todas as policies acima).
