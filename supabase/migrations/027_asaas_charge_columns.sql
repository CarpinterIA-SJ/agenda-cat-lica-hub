-- ============================================================
--  027_asaas_charge_columns.sql
--  Fase 2 da migração Stripe → Asaas: preparação de schema.
--
--  ESTRITAMENTE ADITIVA. Nada é removido ou renomeado — o Stripe
--  continua em produção usando exatamente as mesmas colunas de hoje.
--  A remoção de payment_intent_id só acontece na Fase 5.
-- ============================================================

-- ─── (1) event_registrations.gateway_charge_id ──────────────
-- Substituto neutro de payment_intent_id (nome e semântica do Stripe).
-- Novos registros do Asaas gravam aqui o id da cobrança (pay_xxx);
-- os do Stripe seguem gravando em payment_intent_id, intocado.
alter table public.event_registrations
  add column if not exists gateway_charge_id text;

comment on column public.event_registrations.gateway_charge_id is
  'Id da cobrança no gateway, agnóstico de fornecedor (Asaas: pay_xxx). '
  'Substitui payment_intent_id, que permanece em uso pelo Stripe até a Fase 5.';

-- Espelha registrations_payment_intent_idx: único e PARCIAL, para que as
-- inscrições gratuitas/Stripe (gateway_charge_id null) não colidam entre si.
-- É esse índice que garante a idempotência do webhook do Asaas.
create unique index if not exists registrations_gateway_charge_idx
  on public.event_registrations (gateway_charge_id)
  where gateway_charge_id is not null;

-- ─── (2) payments: sem coluna nova, por decisão ─────────────
-- Avaliado adicionar payments.asaas_payment_id. NÃO foi adicionado:
-- gateway_transaction_id já é genérico, já é o que o stripe-webhook usa
-- e — o ponto decisivo — já possui UNIQUE INDEX
-- (payments_gateway_transaction_id_key). Reaproveitá-lo dá idempotência
-- no nível do banco de graça; uma coluna paralela criaria duas fontes de
-- verdade para "id da transação no gateway" e exigiria um segundo unique.
-- O gateway é distinguido pela coluna payments.gateway ('stripe'|'asaas').

-- Índice de apoio para separar/filtrar as transações por gateway durante a
-- convivência (relatórios, limpeza de dados de teste do sandbox).
create index if not exists payments_gateway_idx
  on public.payments (gateway);

-- ─── (3) Verificação: payments.gateway aceita 'asaas' ───────
-- Confirmado por introspecção antes de escrever esta migration
-- (information_schema: payments.gateway :: text, nullable) — é text livre,
-- não enum, então 'asaas' entra sem ALTER TYPE. O bloco abaixo trava a
-- migration caso isso mude no futuro, em vez de deixar o webhook falhar
-- em runtime com erro de enum.
do $$
declare
  v_type text;
begin
  select data_type into v_type
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'payments'
     and column_name  = 'gateway';

  if v_type is distinct from 'text' then
    raise exception
      'payments.gateway deixou de ser text (agora: %). O Asaas grava gateway=''asaas'' — ajuste o tipo antes de prosseguir.',
      coalesce(v_type, '<coluna ausente>');
  end if;
end;
$$;

-- ─── Nota sobre RLS ─────────────────────────────────────────
-- Nenhuma policy é criada ou alterada aqui: policies do Postgres são
-- ROW-level, então as policies existentes de event_registrations e
-- payments já cobrem a coluna nova sem qualquer mudança. Também não há
-- nenhum DROP POLICY nesta migration — ver §8 do SECURITY.md para a regra
-- de conferir o nome real via SELECT quando houver.
