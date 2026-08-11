-- ============================================================
--  031_ticket_reservations.sql
--  Fase 5: RESERVA de vaga entre a criação da cobrança e o pagamento.
--
--  PROBLEMA QUE ISTO RESOLVE
--  ---------------------------------------------------------------
--  Hoje `event_tickets.sold` só sobe na CONFIRMAÇÃO do pagamento
--  (increment_ticket_sold, migration 018, chamada pelo webhook). Com
--  cartão isso era aceitável: a confirmação vem em segundos, e a janela
--  em que a vaga aparece livre sem estar é curta demais para importar.
--
--  Com PIX e boleto a janela deixa de ser de segundos e passa a ser de
--  horas ou dias — o tempo que a cobrança fica pagável. Nesse intervalo
--  duas pessoas podem gerar cobrança para a MESMA última vaga, e as duas
--  podem pagar. O evento fica com uma inscrição a mais do que a
--  capacidade e alguém precisa ser estornado na mão.
--
--  POR QUE `reserved` É SEPARADO DE `sold` (decisão central)
--  ---------------------------------------------------------------
--  A alternativa óbvia seria incrementar `sold` já no checkout e
--  decrementá-lo se a cobrança expirasse. Foi descartada:
--
--    1. `sold` HOJE significa "venda confirmada" e sete pontos do código
--       já dependem desse significado (webhooks, reconcile-payments,
--       relatórios do organizador, cálculo de receita). Mudar o
--       significado obrigaria a auditar e ajustar todos eles, com risco
--       de erro em código que hoje está correto.
--    2. O fluxo Stripe (cartão) não precisa de reserva e continua em
--       produção. Com `reserved` separado ele NÃO É TOCADO por esta
--       migration: nada no caminho do cartão lê ou escreve a coluna nova.
--    3. "Vaga reservada" e "vaga vendida" são estados diferentes para o
--       organizador. Somados numa coluna só, o número de vendas do painel
--       passaria a incluir cobranças que talvez nunca sejam pagas.
--
--  Fica então:  disponível = quantity - sold - reserved
--  e `sold` mantém exatamente o significado que sempre teve.
--
--  quantity = 0 continua significando ILIMITADO (convenção já existente
--  no schema), e nesse caso nada é barrado — só contabilizado.
--
--  ADITIVO: uma coluna nova com default, uma tabela nova, três funções
--  novas. Nenhuma coluna, policy ou função existente é alterada, então
--  aplicar esta migration sem o código novo não muda comportamento algum.
-- ============================================================

-- ------------------------------------------------------------
--  1. event_tickets.reserved
-- ------------------------------------------------------------
-- default 0 + not null: linhas existentes passam a valer "nenhuma
-- reserva", que é a verdade — nunca houve reserva antes desta migration.
alter table public.event_tickets
  add column if not exists reserved integer not null default 0 check (reserved >= 0);

comment on column public.event_tickets.reserved is
  'Vagas com cobranca criada e ainda NAO paga (PIX/boleto). Separada de '
  '`sold`, que segue significando venda confirmada. Disponivel = '
  'quantity - sold - reserved. Escrita apenas pelas RPCs da migration 031.';

-- ------------------------------------------------------------
--  2. ticket_reservations — o livro-razão da reserva
--
--  A coluna `reserved` é só um contador: sozinha ela não diz QUEM segura
--  a vaga, até quando, nem o que devolver na expiração. Esta tabela é a
--  contrapartida por inscrição — sem ela não haveria como expirar uma
--  reserva específica nem como saber se as opções de campo customizado
--  também precisam ser devolvidas.
-- ------------------------------------------------------------
create table if not exists public.ticket_reservations (
  id               uuid        primary key default gen_random_uuid(),

  -- A inscrição que segura a vaga. Cascade: sumindo a inscrição, a
  -- reserva perde o dono e não faz sentido preservá-la.
  registration_id  uuid        not null references public.event_registrations(id) on delete cascade,

  -- NULL é legítimo: evento sem ingressos nomeados reserva apenas as
  -- opções de campo customizado (options_reserved abaixo). Cascade
  -- porque, apagado o ingresso, o contador `reserved` some junto com ele.
  ticket_id        uuid        references public.event_tickets(id) on delete cascade,

  event_id         uuid        not null references public.events(id) on delete cascade,
  quantity         integer     not null default 1 check (quantity > 0),

  -- Se o checkout também chamou reserve_option_counts. Guardado aqui
  -- porque a liberação precisa saber se há o que devolver, e `selections`
  -- guarda O QUE devolver — a inscrição pode ter sido editada nesse meio.
  options_reserved boolean     not null default false,
  selections       jsonb       not null default '[]'::jsonb,

  status           text        not null default 'held'
                     check (status in ('held', 'confirmed', 'released')),
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);

-- Uma reserva ATIVA por inscrição. O unique é PARCIAL (só 'held') de
-- propósito: as linhas resolvidas ficam como histórico, e a mesma
-- inscrição precisa poder reservar de novo depois de uma liberação —
-- é exatamente o caso da troca de método de pagamento (PIX -> boleto),
-- que libera a reserva anterior e cria outra.
create unique index if not exists ticket_reservations_active_uniq
  on public.ticket_reservations(registration_id)
  where status = 'held';

-- Varredura do expire-reservations: só interessam as que ainda seguram vaga.
create index if not exists ticket_reservations_expires_idx
  on public.ticket_reservations(expires_at)
  where status = 'held';

-- "Quem está segurando vaga neste ingresso" (diagnóstico e conferência
-- do contador contra o livro-razão).
create index if not exists ticket_reservations_ticket_idx
  on public.ticket_reservations(ticket_id)
  where status = 'held';

-- Busca por inscrição em qualquer status (confirm/release/histórico).
create index if not exists ticket_reservations_registration_idx
  on public.ticket_reservations(registration_id);

-- RLS ligada e NENHUMA policy, de propósito: isto é estado interno de
-- contabilidade, não dado de usuário. Sem policy, anon e authenticated
-- não leem nem escrevem nada. Só as RPCs abaixo (security definer) e o
-- service_role tocam a tabela. Mesmo padrão de event_option_counts (021),
-- menos a leitura pública — aqui não há nada que a tela precise ler.
alter table public.ticket_reservations enable row level security;

comment on table public.ticket_reservations is
  'Livro-razao das reservas de vaga (migration 031). RLS habilitada SEM '
  'policy: estado interno, escrito so por reserve_ticket_sold / '
  'confirm_ticket_reservation / release_ticket_reservation.';

-- ------------------------------------------------------------
--  3. reserve_ticket_sold — segura a vaga, atômico.
--
--  Segue o padrão de reserve_option_counts (021): a condição de limite
--  vive no WHERE do UPDATE, então o Postgres serializa os concorrentes na
--  mesma linha e quem chegar depois simplesmente não afeta linha nenhuma.
--  Um SELECT seguido de UPDATE teria a corrida clássica: dois checkouts
--  simultâneos leem "resta 1" e ambos passam.
--
--  Cria a linha do livro-razão E incrementa o contador na MESMA
--  transação — a função inteira é uma transação, então ou os dois
--  acontecem ou nenhum. Contador sem linha (vaga presa para sempre) e
--  linha sem contador (vaga vendida duas vezes) são ambos impossíveis.
--
--  RAISE em vez de retorno booleano: o erro precisa abortar o checkout
--  inteiro, inclusive desfazendo o que já foi feito antes na mesma
--  transação do chamador.
-- ------------------------------------------------------------
create or replace function public.reserve_ticket_sold(
  p_registration_id  uuid,
  p_event_id         uuid,
  p_ticket_id        uuid,
  p_quantity         integer,
  p_expires_at       timestamptz,
  p_options_reserved boolean default false,
  p_selections       jsonb   default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
  v_id   uuid;
  v_qty  integer := coalesce(p_quantity, 1);
begin
  if v_qty <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
  end if;

  -- Só incrementa o contador quando há ingresso nomeado. Sem ticket_id a
  -- reserva existe apenas para segurar as opções de campo customizado.
  if p_ticket_id is not null then
    -- Check-and-increment atômico. `quantity = 0` = ilimitado: conta a
    -- reserva mas não barra ninguém (convenção do schema desde a 003).
    update public.event_tickets
       set reserved = coalesce(reserved, 0) + v_qty
     where id = p_ticket_id
       and event_id = p_event_id          -- coerência: ingresso do evento certo
       and (
         quantity = 0
         or coalesce(sold, 0) + coalesce(reserved, 0) + v_qty <= quantity
       );

    get diagnostics v_rows = row_count;

    if v_rows = 0 then
      -- Zero linhas tem duas causas possíveis e o chamador trata cada uma
      -- de um jeito: ingresso inexistente é bug de integração (500),
      -- esgotado é resposta legítima para o participante (409).
      if not exists (
        select 1 from public.event_tickets
         where id = p_ticket_id and event_id = p_event_id
      ) then
        raise exception 'TICKET_NOT_FOUND' using errcode = 'P0001';
      end if;
      raise exception 'TICKET_FULL' using errcode = 'P0001';
    end if;
  end if;

  insert into public.ticket_reservations (
    registration_id, ticket_id, event_id, quantity,
    options_reserved, selections, status, expires_at
  )
  values (
    p_registration_id, p_ticket_id, p_event_id, v_qty,
    coalesce(p_options_reserved, false), coalesce(p_selections, '[]'::jsonb),
    'held', p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.reserve_ticket_sold(uuid, uuid, uuid, integer, timestamptz, boolean, jsonb) from public;
-- Só o backend reserva. Diferente de reserve_option_counts (que anon
-- executa pelo caminho gratuito), aqui a reserva sempre nasce junto com
-- uma cobrança criada por Edge Function — não há caminho de cliente.
grant execute on function public.reserve_ticket_sold(uuid, uuid, uuid, integer, timestamptz, boolean, jsonb) to service_role;

-- ------------------------------------------------------------
--  4. confirm_ticket_reservation — reserva vira venda.
--
--  IDEMPOTENTE pelo mesmo mecanismo do resto do projeto: o `status =
--  'held'` mora no WHERE do UPDATE, então só a transição held ->
--  confirmed afeta linha. Webhook reentregue pelo Asaas, corrida entre o
--  webhook e o reconcile-payments, ou reprocesso manual: o segundo
--  chamador vê zero linhas, retorna false e NÃO mexe nos contadores.
--
--  Retorna true se ESTA chamada realizou a transição; false se não havia
--  reserva ativa (já confirmada, já liberada, ou nunca existiu — o caso
--  do fluxo Stripe, que não reserva). O chamador usa esse false para
--  decidir se ainda precisa chamar increment_ticket_sold pelo caminho
--  antigo.
--
--  NÃO chama tally_option_counts: as opções já foram contadas no
--  checkout, por reserve_option_counts. Contar de novo aqui duplicaria.
-- ------------------------------------------------------------
create or replace function public.confirm_ticket_reservation(
  p_registration_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket uuid;
  v_qty    integer;
begin
  update public.ticket_reservations
     set status = 'confirmed', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'held'
  returning ticket_id, quantity into v_ticket, v_qty;

  if not found then
    return false;
  end if;

  if v_ticket is not null then
    -- Transferência numa instrução só: nenhum instante intermediário em
    -- que a vaga não esteja em coluna nenhuma (apareceria como livre).
    -- greatest(0, ...) protege o contador de ficar negativo caso ele já
    -- tenha sido zerado por algum caminho anterior.
    update public.event_tickets
       set reserved = greatest(0, coalesce(reserved, 0) - v_qty),
           sold     = coalesce(sold, 0) + v_qty
     where id = v_ticket;
  end if;

  return true;
end;
$$;

revoke all on function public.confirm_ticket_reservation(uuid) from public;
grant execute on function public.confirm_ticket_reservation(uuid) to service_role;

-- ------------------------------------------------------------
--  5. release_ticket_reservation — devolve a vaga.
--
--  Usada na expiração da cobrança, no cancelamento antes do pagamento e
--  na troca de método de pagamento. Idempotente pelo mesmo `status =
--  'held'` no WHERE — liberar duas vezes não devolve a vaga duas vezes.
--
--  ATENÇÃO (Etapa 4): quem chama isto precisa APAGAR a cobrança no Asaas
--  ANTES de liberar. O QR do PIX segue pagável por até 12 meses após o
--  dueDate; liberar a vaga sem apagar a cobrança recria exatamente o
--  problema que esta migration existe para resolver.
-- ------------------------------------------------------------
create or replace function public.release_ticket_reservation(
  p_registration_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket     uuid;
  v_qty        integer;
  v_event      uuid;
  v_opts       boolean;
  v_selections jsonb;
begin
  update public.ticket_reservations
     set status = 'released', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'held'
  returning ticket_id, quantity, event_id, options_reserved, selections
       into v_ticket, v_qty, v_event, v_opts, v_selections;

  if not found then
    return false;
  end if;

  if v_ticket is not null then
    update public.event_tickets
       set reserved = greatest(0, coalesce(reserved, 0) - v_qty)
     where id = v_ticket;
  end if;

  -- As opções foram seguradas por reserve_option_counts no checkout;
  -- devolvê-las é responsabilidade da mesma liberação, senão a vaga do
  -- ingresso volta mas a da opção fica presa para sempre.
  if v_opts then
    perform public.release_option_counts(v_event, v_selections);
  end if;

  return true;
end;
$$;

revoke all on function public.release_ticket_reservation(uuid) from public;
grant execute on function public.release_ticket_reservation(uuid) to service_role;
