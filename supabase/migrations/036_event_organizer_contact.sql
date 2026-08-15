-- ============================================================
--  036 — Contato do organizador para o participante (RPC)
-- ============================================================
--
--  PROBLEMA
--  O diálogo de cancelamento de inscrição PAGA (MyTicketDetailPage)
--  manda o participante "entrar em contato com o organizador", mas não
--  mostra contato nenhum. `organizations.contact_email` (017) existe,
--  mas o participante não lê a tabela organizations: as únicas policies
--  de SELECT (001:93, 002:22, 008:29, 020:19) cobrem membro
--  (user_org_ids()), owner (owner_id = auth.uid()) e platform admin
--  (is_platform_admin()) — nenhuma cobre "participante de um evento da
--  organização". Um embed `event:events(*, organization:organizations(*))`
--  simplesmente voltaria com organization = null pra ele, sem erro.
--
--  organizations não tem telefone/whatsapp — só contact_email (017),
--  name, description, logo_url. events também não tem coluna de
--  contato própria (conferido em 001, 003, 008, 011, 013). E-mail é a
--  única via.
--
--  SOLUÇÃO
--  RPC security definer, não uma nova policy de SELECT em organizations.
--  Evita alargar a visibilidade da linha inteira de organizations
--  (status, rejection_reason, status_updated_by são internos de
--  moderação e não têm por que chegar ao participante) — a função
--  devolve só as duas colunas que a UI precisa. Autorização: só quem
--  tem ALGUMA inscrição própria (event_registrations.user_id =
--  auth.uid()) para aquele evento recebe o contato do organizador dele.
-- ============================================================

create or replace function public.get_event_organizer_contact(p_event_id uuid)
returns table (organization_name text, contact_email text)
language sql
security definer
set search_path = ''
stable
as $$
  select o.name, o.contact_email
    from public.organizations o
    join public.events e on e.organization_id = o.id
   where e.id = p_event_id
     and exists (
       select 1
         from public.event_registrations r
        where r.event_id = p_event_id
          and r.user_id = auth.uid()
     );
$$;

revoke all on function public.get_event_organizer_contact(uuid) from public;
grant execute on function public.get_event_organizer_contact(uuid) to authenticated;

comment on function public.get_event_organizer_contact(uuid) is
  'Migration 036: devolve nome e contact_email da organizacao dona do '
  'evento, restrito a quem tem inscricao propria nesse evento. '
  'security definer contorna a RLS de organizations (que nao cobre '
  'participante) sem abrir a linha inteira -- so as duas colunas.';
