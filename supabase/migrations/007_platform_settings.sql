-- ============================================================
--  007_platform_settings.sql
--  Configurações globais da plataforma (chave/valor).
--  Leitura e escrita restritas a platform admins.
-- ============================================================

create table public.platform_settings (
  id          uuid        primary key default uuid_generate_v4(),
  key         text        not null unique,
  value       text        not null,
  updated_by  uuid        references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

-- Somente platform admin lê
create policy "platform_settings: admin lê"
  on public.platform_settings for select
  using (public.is_platform_admin());

-- Somente platform admin insere
create policy "platform_settings: admin insere"
  on public.platform_settings for insert
  with check (public.is_platform_admin());

-- Somente platform admin atualiza
create policy "platform_settings: admin atualiza"
  on public.platform_settings for update
  using  (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ─── Configuração inicial: taxa da plataforma (%) ───────────
insert into public.platform_settings (key, value)
values ('taxa_plataforma_percent', '5');
