-- ============================================================
--  024_schedule_reconcile_payments.sql
--  Agenda a Edge Function reconcile-payments de hora em hora.
--
--  Rede de segurança para webhooks do Stripe que falham/não chegam:
--  inscrições presas em 'pending' > 2h são reconciliadas consultando o
--  PaymentIntent direto na API. O webhook continua o caminho PRINCIPAL —
--  isto é complementar. A função é idempotente (checa payments por
--  gateway_transaction_id; markCancelled usa .neq('confirmed')).
--
--  SEGURANÇA: a service_role key NÃO está nesta migration. Fica no
--  Supabase Vault sob o nome 'reconcile_service_role_key' (inserida FORA
--  do git). O cron a lê via vault.decrypted_secrets em tempo de execução.
--  reconcile-payments tem verify_jwt=true, então o header Authorization
--  com a service_role (um JWT válido) é obrigatório.
--
--  ADITIVO: habilita extensões + 1 cron job. NÃO altera tabelas/funções
--  de pagamento nem a lógica da reconcile-payments.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotente: cron.schedule sobrescreve o job se o nome já existir.
select cron.schedule(
  'reconcile-payments-hourly',
  '0 * * * *',
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
    body    := '{}'::jsonb
  );
  $$
);
