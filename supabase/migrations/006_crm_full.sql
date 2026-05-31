-- ============================================================
--  006_crm_full.sql
--  Expansão do CRM: tags, grupos, setores, categorias e tabelas
--  de junção contato↔tag / contato↔grupo.
--  Padrão de RLS: membros da org leem; admin da org gerencia.
-- ============================================================

-- ─── Helper macro de RLS (documentação) ─────────────────────
--   SELECT  → organization_id in (select public.user_org_ids())
--   INSERT/UPDATE/DELETE → organization_id in (select public.user_admin_org_ids())

-- ============================================================
--  CRM TAGS
-- ============================================================
create table public.crm_tags (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  name            text        not null,
  description     text,
  color           text,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index crm_tags_org_idx on public.crm_tags(organization_id);

alter table public.crm_tags enable row level security;

create policy "crm_tags: membros leem"
  on public.crm_tags for select
  using (organization_id in (select public.user_org_ids()));

create policy "crm_tags: admin gerencia (insert)"
  on public.crm_tags for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_tags: admin gerencia (update)"
  on public.crm_tags for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_tags: admin gerencia (delete)"
  on public.crm_tags for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ============================================================
--  CRM GROUPS
-- ============================================================
create table public.crm_groups (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  name            text        not null,
  description     text,
  color           text,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index crm_groups_org_idx on public.crm_groups(organization_id);

alter table public.crm_groups enable row level security;

create policy "crm_groups: membros leem"
  on public.crm_groups for select
  using (organization_id in (select public.user_org_ids()));

create policy "crm_groups: admin gerencia (insert)"
  on public.crm_groups for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_groups: admin gerencia (update)"
  on public.crm_groups for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_groups: admin gerencia (delete)"
  on public.crm_groups for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ============================================================
--  CRM SECTORS
-- ============================================================
create table public.crm_sectors (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  name            text        not null,
  description     text,
  color           text,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index crm_sectors_org_idx on public.crm_sectors(organization_id);

alter table public.crm_sectors enable row level security;

create policy "crm_sectors: membros leem"
  on public.crm_sectors for select
  using (organization_id in (select public.user_org_ids()));

create policy "crm_sectors: admin gerencia (insert)"
  on public.crm_sectors for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_sectors: admin gerencia (update)"
  on public.crm_sectors for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_sectors: admin gerencia (delete)"
  on public.crm_sectors for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ============================================================
--  CRM CATEGORIES
-- ============================================================
create table public.crm_categories (
  id              uuid        primary key default uuid_generate_v4(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  name            text        not null,
  description     text,
  color           text,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create index crm_categories_org_idx on public.crm_categories(organization_id);

alter table public.crm_categories enable row level security;

create policy "crm_categories: membros leem"
  on public.crm_categories for select
  using (organization_id in (select public.user_org_ids()));

create policy "crm_categories: admin gerencia (insert)"
  on public.crm_categories for insert
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_categories: admin gerencia (update)"
  on public.crm_categories for update
  using  (organization_id in (select public.user_admin_org_ids()))
  with check (organization_id in (select public.user_admin_org_ids()));

create policy "crm_categories: admin gerencia (delete)"
  on public.crm_categories for delete
  using (organization_id in (select public.user_admin_org_ids()));

-- ============================================================
--  crm_contacts: novas FKs sector_id / category_id
-- ============================================================
alter table public.crm_contacts
  add column sector_id   uuid references public.crm_sectors(id)    on delete set null,
  add column category_id uuid references public.crm_categories(id) on delete set null;

create index crm_contacts_sector_idx   on public.crm_contacts(sector_id);
create index crm_contacts_category_idx on public.crm_contacts(category_id);

-- ============================================================
--  JUNÇÃO: crm_contact_tags
--  RLS deriva a org a partir do contato referenciado.
-- ============================================================
create table public.crm_contact_tags (
  id          uuid        primary key default uuid_generate_v4(),
  contact_id  uuid        not null references public.crm_contacts(id) on delete cascade,
  tag_id      uuid        not null references public.crm_tags(id)     on delete cascade,
  created_at  timestamptz not null default now(),
  unique (contact_id, tag_id)
);

create index crm_contact_tags_contact_idx on public.crm_contact_tags(contact_id);
create index crm_contact_tags_tag_idx     on public.crm_contact_tags(tag_id);

alter table public.crm_contact_tags enable row level security;

create policy "crm_contact_tags: membros leem"
  on public.crm_contact_tags for select
  using (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_org_ids())
    )
  );

create policy "crm_contact_tags: admin gerencia (insert)"
  on public.crm_contact_tags for insert
  with check (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_admin_org_ids())
    )
  );

create policy "crm_contact_tags: admin gerencia (delete)"
  on public.crm_contact_tags for delete
  using (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_admin_org_ids())
    )
  );

-- ============================================================
--  JUNÇÃO: crm_contact_groups
-- ============================================================
create table public.crm_contact_groups (
  id          uuid        primary key default uuid_generate_v4(),
  contact_id  uuid        not null references public.crm_contacts(id) on delete cascade,
  group_id    uuid        not null references public.crm_groups(id)   on delete cascade,
  created_at  timestamptz not null default now(),
  unique (contact_id, group_id)
);

create index crm_contact_groups_contact_idx on public.crm_contact_groups(contact_id);
create index crm_contact_groups_group_idx   on public.crm_contact_groups(group_id);

alter table public.crm_contact_groups enable row level security;

create policy "crm_contact_groups: membros leem"
  on public.crm_contact_groups for select
  using (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_org_ids())
    )
  );

create policy "crm_contact_groups: admin gerencia (insert)"
  on public.crm_contact_groups for insert
  with check (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_admin_org_ids())
    )
  );

create policy "crm_contact_groups: admin gerencia (delete)"
  on public.crm_contact_groups for delete
  using (
    contact_id in (
      select id from public.crm_contacts
      where organization_id in (select public.user_admin_org_ids())
    )
  );
