-- ============================================================
--  001_initial_schema.sql
--  Schema inicial do Guardião Eventos
-- ============================================================

-- Extensão para geração de UUIDs
create extension if not exists "uuid-ossp";

-- ─── ENUMS ──────────────────────────────────────────────────

create type public.org_member_role as enum ('owner', 'admin', 'member');
create type public.project_status  as enum ('active', 'archived', 'draft');

-- ─── PROFILES ───────────────────────────────────────────────
-- Criado automaticamente via trigger quando um usuário se registra.

create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: leitura própria"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: atualização própria"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── ORGANIZATIONS ──────────────────────────────────────────

create table public.organizations (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  slug        text        not null unique,
  owner_id    uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ─── ORGANIZATION MEMBERS ───────────────────────────────────

create table public.organization_members (
  id              uuid                   primary key default uuid_generate_v4(),
  organization_id uuid                   not null references public.organizations(id) on delete cascade,
  user_id         uuid                   not null references public.profiles(id) on delete cascade,
  role            public.org_member_role not null default 'member',
  joined_at       timestamptz            not null default now(),
  unique (organization_id, user_id)
);

alter table public.organization_members enable row level security;

-- ─── PROJECTS ───────────────────────────────────────────────

create table public.projects (
  id              uuid                  primary key default uuid_generate_v4(),
  organization_id uuid                  not null references public.organizations(id) on delete cascade,
  name            text                  not null,
  description     text,
  status          public.project_status not null default 'draft',
  created_at      timestamptz           not null default now(),
  updated_at      timestamptz           not null default now()
);

alter table public.projects enable row level security;

-- ─── FUNÇÃO AUXILIAR DE RLS ─────────────────────────────────
-- Retorna os IDs das organizações a que o usuário corrente pertence.

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select organization_id
  from   public.organization_members
  where  user_id = auth.uid()
$$;

-- ─── RLS: ORGANIZATIONS ─────────────────────────────────────

create policy "organizations: membros podem ler"
  on public.organizations for select
  using (id in (select public.user_org_ids()));

create policy "organizations: proprietário pode criar"
  on public.organizations for insert
  with check (owner_id = auth.uid());

create policy "organizations: proprietário pode atualizar"
  on public.organizations for update
  using (owner_id = auth.uid());

create policy "organizations: proprietário pode excluir"
  on public.organizations for delete
  using (owner_id = auth.uid());

-- ─── RLS: ORGANIZATION MEMBERS ──────────────────────────────

create policy "org_members: membros podem ler"
  on public.organization_members for select
  using (organization_id in (select public.user_org_ids()));

create policy "org_members: owner/admin podem adicionar"
  on public.organization_members for insert
  with check (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = organization_members.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

create policy "org_members: owner/admin podem remover"
  on public.organization_members for delete
  using (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = organization_members.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

create policy "org_members: owner/admin podem alterar papel"
  on public.organization_members for update
  using (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = organization_members.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

-- ─── RLS: PROJECTS ──────────────────────────────────────────

create policy "projects: membros podem ler"
  on public.projects for select
  using (organization_id in (select public.user_org_ids()));

create policy "projects: owner/admin podem criar"
  on public.projects for insert
  with check (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = projects.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

create policy "projects: owner/admin podem atualizar"
  on public.projects for update
  using (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = projects.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

create policy "projects: owner/admin podem excluir"
  on public.projects for delete
  using (
    exists (
      select 1
      from   public.organization_members m
      where  m.organization_id = projects.organization_id
        and  m.user_id = auth.uid()
        and  m.role in ('owner', 'admin')
    )
  );

-- ─── TRIGGER: perfil automático ao registrar ────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── TRIGGER: atualização automática de updated_at ──────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();
