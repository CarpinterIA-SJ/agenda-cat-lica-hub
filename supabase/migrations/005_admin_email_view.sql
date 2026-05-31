-- ============================================================
--  005_admin_email_view.sql
--  RPC para listagem administrativa de usuários incluindo o
--  e-mail (que vive em auth.users e não é exposto via cliente).
--  Acesso restrito a platform admins (superadmin/admin).
-- ============================================================

-- ─── get_admin_user_list ────────────────────────────────────
-- Junta auth.users (e-mail) com public.profiles (nome/avatar).
-- security definer para poder ler auth.users, mas barra na
-- primeira linha quem não for platform admin.

create or replace function public.get_admin_user_list()
returns table (
  user_id    uuid,
  email      text,
  name       text,
  avatar_url text,
  created_at timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado: requer privilégio de administrador da plataforma.'
      using errcode = '42501';
  end if;

  return query
    select
      u.id          as user_id,
      u.email::text as email,
      p.name        as name,
      p.avatar_url  as avatar_url,
      p.created_at  as created_at
    from   auth.users u
    left join public.profiles p on p.id = u.id
    order by p.created_at nulls last, u.email;
end;
$$;

grant execute on function public.get_admin_user_list() to authenticated;
