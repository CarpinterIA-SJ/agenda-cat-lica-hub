-- ============================================================
--  017_organization_profile_fields.sql
--  Persiste E-mail de contato, Descrição e Logo da organização.
--
--  ADITIVO: apenas ADD COLUMN (nullable, sem default, sem NOT NULL
--  — orgs existentes não quebram) + bucket de Storage para o logo
--  com policies próprias. NÃO altera nenhuma policy de
--  public.organizations (as de owner já cobrem INSERT/UPDATE
--  destas colunas).
-- ============================================================

-- ─── COLUNAS ────────────────────────────────────────────────
alter table public.organizations
  add column if not exists contact_email text,
  add column if not exists description   text,
  add column if not exists logo_url      text;

-- ─── STORAGE: bucket público para logos ─────────────────────
-- Leitura pública (logo aparece em listagens). Escrita restrita
-- ao usuário autenticado, somente sob a sua própria pasta
-- ({auth.uid()}/...), o que já equivale a "somente o dono".
insert into storage.buckets (id, name, public)
values ('organization-logos', 'organization-logos', true)
on conflict (id) do nothing;

-- Policies em storage.objects (nomes próprios; não tocam outras tabelas).
drop policy if exists "org-logos: leitura pública" on storage.objects;
create policy "org-logos: leitura pública"
  on storage.objects for select
  using (bucket_id = 'organization-logos');

drop policy if exists "org-logos: dono insere" on storage.objects;
create policy "org-logos: dono insere"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "org-logos: dono atualiza" on storage.objects;
create policy "org-logos: dono atualiza"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "org-logos: dono remove" on storage.objects;
create policy "org-logos: dono remove"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'organization-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
