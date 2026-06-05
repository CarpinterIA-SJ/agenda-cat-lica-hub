-- ============================================================
--  012_platform_settings_public_read.sql
--  (1) Leitura pública SOMENTE da taxa da plataforma, para que o
--      checkout/front exiba o valor correto sem expor outras configs.
--  (2) Tabela de logs de auditoria administrativa (audit_logs),
--      persistida no banco com RLS (substitui o localStorage).
-- ============================================================

-- ─── (1) Leitura pública da taxa ────────────────────────────
-- Permite que qualquer um (anon/authenticated) leia APENAS a linha
-- key = 'taxa_plataforma_percent'. Demais chaves seguem restritas
-- às policies de admin definidas na migration 007.
create policy "platform_settings: leitura publica da taxa"
  on public.platform_settings for select
  using (key = 'taxa_plataforma_percent');

-- ─── (2) Logs de auditoria ──────────────────────────────────
create table public.audit_logs (
  id              uuid        primary key default uuid_generate_v4(),
  actor_id        uuid        references public.profiles(id) on delete set null,
  actor_email     text,
  action          text        not null,
  entity_type     text        not null,
  entity_id       text,
  details         jsonb       not null default '{}'::jsonb,
  ip_address      text,
  created_at      timestamptz not null default now()
);

create index audit_logs_actor_idx    on public.audit_logs(actor_id);
create index audit_logs_action_idx   on public.audit_logs(action);
create index audit_logs_entity_idx   on public.audit_logs(entity_type, entity_id);
create index audit_logs_created_idx  on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Somente platform admin lê os logs.
create policy "audit_logs: somente platform admin le"
  on public.audit_logs for select
  using (public.is_platform_admin());

-- Qualquer usuário autenticado pode inserir log (registro das próprias ações).
create policy "audit_logs: authenticated insere"
  on public.audit_logs for insert
  with check (auth.uid() is not null);
