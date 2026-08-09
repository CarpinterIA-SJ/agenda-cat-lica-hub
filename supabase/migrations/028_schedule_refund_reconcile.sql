-- ============================================================
--  028_schedule_refund_reconcile.sql
--  Agenda o SCAN DE ESTORNOS da reconcile-payments, 1x por dia.
--
--  O QUE ISTO TAPA
--  A 024 já agenda 'reconcile-payments-hourly', mas aquele scan só
--  varre event_registrations com status='pending'. Uma venda JÁ
--  CONFIRMADA cujo PAYMENT_REFUNDED (Asaas) / charge.refunded (Stripe)
--  nunca foi entregue ficava válida para sempre no sistema, mesmo com o
--  dinheiro devolvido de verdade no gateway — sem nenhuma rede de
--  segurança. O scan 'refunds' reconsulta os pagamentos 'paid' recentes
--  e aplica a mesma reversão dos webhooks quando o gateway confirma que
--  o estorno FOI EFETIVADO.
--
--  POR QUE DIÁRIO, E NÃO DE HORA EM HORA
--  Custo: o scan gasta 1 chamada de API por venda paga dentro da janela
--  (90 dias). De hora em hora seriam 24x as chamadas por dia para vigiar
--  um sinal que muda devagar — estorno não é evento de alta frequência.
--  Urgência: uma inscrição presa em 'pending' segura vaga e trava o
--  comprador, por isso aquele scan é horário. Um estorno não entregue
--  não bloqueia ninguém: deixa uma vaga vendida indevidamente, que
--  algumas horas a mais não agravam.
--  Isolamento: cron separado mantém a latência e a superfície de falha
--  do job horário exatamente como estavam.
--
--  05:00 UTC = 02:00 BRT, fora do horário de pico de compra.
--
--  SEGURANÇA: mesmo padrão da 024 — a service_role key NÃO está aqui.
--  Fica no Supabase Vault sob 'reconcile_service_role_key' (inserida
--  FORA do git) e é lida via vault.decrypted_secrets em tempo de
--  execução. reconcile-payments tem verify_jwt=true, então o header
--  Authorization com a service_role (JWT válido) é obrigatório.
--
--  ADITIVO: cria 1 cron job. NÃO altera o job da 024, nem tabelas,
--  nem funções de pagamento, nem a lógica do scan de 'pending'.
-- ============================================================

-- Já habilitadas pela 024; repetidas porque a migration precisa rodar
-- sozinha em um banco novo.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotente: cron.schedule sobrescreve o job se o nome já existir.
--
-- O body é o que distingue este job do horário: sem `scan`, a função
-- assume 'pending' (default preservado justamente para a 024 continuar
-- funcionando sem alteração nenhuma).
select cron.schedule(
  'reconcile-refunds-daily',
  '0 5 * * *',
  $$
  select net.http_post(
    url     := 'https://ehxhgakvirzxroryebvl.supabase.co/functions/v1/reconcile-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'reconcile_service_role_key'
      )
    ),
    body    := '{"scan":"refunds"}'::jsonb
  );
  $$
);
