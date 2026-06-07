-- ============================================================
--  014_admin_financial_read.sql
--  Leitura para o platform admin no dashboard financeiro.
--  ADITIVO: apenas CREATE POLICY (SELECT), espelhando 008/013.
--  NÃO recria tabelas, NÃO remove policies, NÃO altera dados.
--
--  Sem isto o admin (não-membro das orgs) recebe 0 linhas via RLS
--  em payments/event_registrations/event_tickets, inviabilizando o
--  volume processado, as transações e a receita por evento/org.
-- ============================================================

drop policy if exists "payments: platform admin lê" on public.payments;
create policy "payments: platform admin lê"
  on public.payments for select
  using (public.is_platform_admin());

drop policy if exists "event_registrations: platform admin lê" on public.event_registrations;
create policy "event_registrations: platform admin lê"
  on public.event_registrations for select
  using (public.is_platform_admin());

drop policy if exists "event_tickets: platform admin lê" on public.event_tickets;
create policy "event_tickets: platform admin lê"
  on public.event_tickets for select
  using (public.is_platform_admin());
