-- ============================================================
--  039_paid_path_reservations.sql
--  Fase 5: amarra o caminho PAGO ao sistema de reservas atômicas da 031
--  (hoje órfão no pago — só o gratuito usa, desde a 034).
--
--  Três mudanças, decididas e aprovadas nesta sessão:
--
--  (1) confirm_ticket_reservation deixa de retornar boolean. `false` hoje
--      cobre TRÊS causas que o chamador precisa tratar diferente:
--        - já confirmada (reenvio de webhook)         → no-op
--        - já liberada, mas o dinheiro caiu depois     → ALARME, não
--          incrementa sold cego (o ingresso pode já estar esgotado)
--        - nunca existiu (registro anterior a este deploy, caminho pago
--          sem reserva) → cai para increment_ticket_sold, como hoje
--      A classificação acontece DENTRO da mesma transação do UPDATE
--      guardado — é só diagnóstico sobre o que já aconteceu, nenhuma
--      decisão nova é tomada a partir dela, então não reabre a corrida
--      que o WHERE guardado existe para fechar.
--
--  (2) ticket_reservations ganha user_id (derivado da inscrição, nunca de
--      parâmetro do chamador) e um índice único parcial: no máximo UMA
--      reserva 'held' por (user_id, event_id). Reserva duplicada — trocar
--      de método de pagamento, refazer o checkout — vira erro
--      DUPLICATE_HOLD em vez de reservar vaga duas vezes para a mesma
--      pessoa. O fluxo de checkout que resolve isso ANTES de chamar
--      reserve_ticket_sold (reconsultar a cobrança antiga no Asaas,
--      apagar se não paga, abortar se paga) fica para a Edge Function —
--      este índice é o backstop atômico contra a corrida entre duas
--      requisições simultâneas que passassem os dois pela checagem da
--      aplicação ao mesmo tempo.
--
--  (3) create_free_registration (034) atualizada para o novo retorno de
--      confirm_ticket_reservation. Único chamador existente da função —
--      sem isso a 034 quebra na primeira inscrição gratuita após esta
--      migration.
--
--  CONTEXTO DE DEPLOY (registrado aqui por rastreabilidade): produção
--  está com ZERO inscrições pendentes no momento desta migration — não há
--  PIX em circulação para reconciliar. O fallback NOT_FOUND em
--  confirm_ticket_reservation é mantido mesmo assim (é barato e correto
--  manter), mas não há cauda legada real para ele resolver agora.
--
--  ADITIVO: uma coluna nova, um índice novo, dois CREATE OR REPLACE e um
--  DROP+CREATE (troca de tipo de retorno não é possível via CREATE OR
--  REPLACE em Postgres). Nenhuma tabela ou policy existente é removida.
-- ============================================================

-- ─── 1. ticket_reservations.user_id ──────────────────────────
-- Nullable, mesma política de event_registrations.user_id (on delete set
-- null): perfil apagado não deve arrastar o livro-razão de reservas junto.
alter table public.ticket_reservations
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- Backfill das linhas já existentes (031/034 já rodam em produção).
update public.ticket_reservations tr
   set user_id = er.user_id
  from public.event_registrations er
 where tr.registration_id = er.id
   and tr.user_id is null;

comment on column public.ticket_reservations.user_id is
  'Dono da reserva, derivado de event_registrations.user_id dentro de '
  'reserve_ticket_sold (NUNCA recebido como parametro — evita reserva '
  'em nome de terceiro por bug de chamador). Sustenta o indice '
  'ticket_reservations_one_hold_per_user_event.';

-- ─── 2. no máximo UMA reserva 'held' por (user_id, event_id) ────
-- NULLs em user_id não colidem entre si (semântica padrão de índice único
-- em Postgres) — reserva sem dono identificável nunca bloqueia outra.
create unique index if not exists ticket_reservations_one_hold_per_user_event
  on public.ticket_reservations(user_id, event_id)
  where status = 'held';

comment on index public.ticket_reservations_one_hold_per_user_event is
  'Backstop atômico: no máximo uma reserva held por participante por '
  'evento. A resolução "amigável" (reconsultar Asaas, apagar cobrança '
  'antiga não paga, ou abortar o novo checkout se a antiga já foi paga) '
  'é responsabilidade do asaas-checkout; este índice só garante que duas '
  'requisições simultâneas não furem essa checagem e dupliquem a vaga.';

-- ------------------------------------------------------------
--  3. reserve_ticket_sold — agora preenche user_id e classifica
--     violação do novo índice como erro amigável.
--
--  Corpo idêntico ao da 031 exceto: (a) lookup de v_user_id a partir da
--  inscrição, (b) user_id na coluna do insert, (c) bloco exception em
--  volta do insert para distinguir "duplicou a reserva do mesmo
--  participante" (novo índice, DUPLICATE_HOLD) de qualquer outra
--  violação de unicidade (comportamento inalterado — propaga como antes).
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
  v_rows       integer;
  v_id         uuid;
  v_qty        integer := coalesce(p_quantity, 1);
  v_user_id    uuid;
  v_constraint text;
begin
  if v_qty <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
  end if;

  -- Dono da reserva: SEMPRE derivado da inscrição já existente (ordem
  -- insert-depois-reserva da 034 garante que ela já está lá), nunca de
  -- parâmetro — mesmo motivo de create_free_registration nunca aceitar
  -- user_id de fora.
  select user_id into v_user_id
    from public.event_registrations
   where id = p_registration_id;

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

  begin
    insert into public.ticket_reservations (
      registration_id, ticket_id, event_id, user_id, quantity,
      options_reserved, selections, status, expires_at
    )
    values (
      p_registration_id, p_ticket_id, p_event_id, v_user_id, v_qty,
      coalesce(p_options_reserved, false), coalesce(p_selections, '[]'::jsonb),
      'held', p_expires_at
    )
    returning id into v_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'ticket_reservations_one_hold_per_user_event' then
        raise exception 'DUPLICATE_HOLD' using errcode = 'P0001';
      end if;
      -- Qualquer outra violação de unicidade (ex.: registration_id já com
      -- reserva held — ticket_reservations_active_uniq, 031) propaga sem
      -- reclassificar: comportamento inalterado em relação à 031.
      raise;
  end;

  return v_id;
end;
$$;

-- Grants inalterados em relação à 031 (mesma assinatura — CREATE OR
-- REPLACE preserva). Reafirmado por clareza, não por necessidade.
revoke all on function public.reserve_ticket_sold(uuid, uuid, uuid, integer, timestamptz, boolean, jsonb) from public;
grant execute on function public.reserve_ticket_sold(uuid, uuid, uuid, integer, timestamptz, boolean, jsonb) to service_role;

-- ------------------------------------------------------------
--  4. confirm_ticket_reservation — troca boolean por 4 estados.
--
--  DROP + CREATE porque Postgres não permite mudar o tipo de retorno via
--  CREATE OR REPLACE. Grants são perdidos no DROP — reconcedidos abaixo,
--  OBRIGATÓRIO (não é reafirmação defensiva desta vez).
--
--  Retorno:
--    'CONFIRMED'         → esta chamada fez a transição held -> confirmed
--    'ALREADY_CONFIRMED' → reenvio/corrida: outra chamada já confirmou.
--                          No-op seguro, NÃO mexe em sold de novo.
--    'RELEASED'          → a reserva já tinha sido liberada (expirou, ou
--                          foi liberada pela troca de método de
--                          pagamento) e o dinheiro caiu depois. Não
--                          existe ação segura automática aqui — o
--                          ingresso pode já estar esgotado para outra
--                          pessoa. O chamador deve alarmar (audit_logs) e
--                          tratar como reconciliação manual, nunca
--                          incrementar sold cego.
--    'NOT_FOUND'         → nenhuma linha em ticket_reservations para esta
--                          inscrição. Hoje (produção com zero pendentes)
--                          isto não deveria disparar para nenhuma venda
--                          nova; existe para não quebrar a cauda legada
--                          caso apareça. O chamador cai para
--                          increment_ticket_sold, o caminho de antes
--                          desta Fase 5.
-- ------------------------------------------------------------
drop function if exists public.confirm_ticket_reservation(uuid);

create function public.confirm_ticket_reservation(
  p_registration_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket uuid;
  v_qty    integer;
  v_status text;
begin
  update public.ticket_reservations
     set status = 'confirmed', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'held'
  returning ticket_id, quantity into v_ticket, v_qty;

  if found then
    if v_ticket is not null then
      -- Transferência numa instrução só: nenhum instante intermediário em
      -- que a vaga não esteja em coluna nenhuma (apareceria como livre).
      update public.event_tickets
         set reserved = greatest(0, coalesce(reserved, 0) - v_qty),
             sold     = coalesce(sold, 0) + v_qty
       where id = v_ticket;
    end if;
    return 'CONFIRMED';
  end if;

  -- 0 linhas no UPDATE guardado acima: classifica DENTRO desta mesma
  -- transação. Puramente diagnóstico — nenhuma decisão de contador é
  -- tomada com base nisto, então não reabre a corrida que o WHERE
  -- guardado do UPDATE já fechou. No fluxo atual existe no máximo UMA
  -- linha por registration_id (reserve_ticket_sold roda uma vez por
  -- inscrição), então não há ambiguidade de qual linha olhar.
  select status into v_status
    from public.ticket_reservations
   where registration_id = p_registration_id;

  if v_status = 'confirmed' then
    return 'ALREADY_CONFIRMED';
  elsif v_status = 'released' then
    return 'RELEASED';
  else
    return 'NOT_FOUND';
  end if;
end;
$$;

revoke all on function public.confirm_ticket_reservation(uuid) from public;
grant execute on function public.confirm_ticket_reservation(uuid) to service_role;

comment on function public.confirm_ticket_reservation(uuid) is
  'Reserva held -> confirmed, atomico (migration 031). Desde a 039 '
  'retorna text (CONFIRMED / ALREADY_CONFIRMED / RELEASED / NOT_FOUND) '
  'em vez de boolean -- o chamador PRECISA distinguir os 4 casos, ver '
  'cabecalho da 039. Unico chamador hoje: create_free_registration (034).';

-- ------------------------------------------------------------
--  5. create_free_registration — acompanha o novo retorno.
--
--  Corpo idêntico ao da 034, exceto a variável v_confirmed (boolean) virar
--  v_confirm_result (text) e a checagem do passo 8. Único chamador de
--  confirm_ticket_reservation antes desta migration — sem este ajuste a
--  primeira inscrição gratuita após o deploy quebra (comparação de text
--  contra boolean). Assinatura da função NÃO muda — o front chama com os
--  mesmos 10 parâmetros de sempre.
-- ------------------------------------------------------------
create or replace function public.create_free_registration(
  p_event_id      uuid,
  p_ticket_id     uuid    default null,
  p_full_name     text    default '',
  p_email         text    default '',
  p_cpf           text    default null,
  p_phone         text    default null,
  p_birth_date    date    default null,
  p_custom_fields jsonb   default '{}'::jsonb,
  p_selections    jsonb   default '[]'::jsonb,
  p_coupon_code   text    default null
)
returns public.event_registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid            uuid := auth.uid();
  v_coupon_id      uuid;
  v_kind           public.discount_kind;
  v_value          numeric;
  v_price          integer := 0;
  v_efetivo        numeric;
  v_reg            public.event_registrations;
  v_confirm_result text;
begin
  -- 1. Login obrigatório. Inscrição anônima já não funcionava (a policy
  --    exige user_id = auth.uid(), e NULL = NULL é NULL, não true), e
  --    vaga limitada não tem como ser controlada sem identidade.
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  -- 2. Espelho da policy 003:194-202 (ver bloco de comentário acima).
  if not (public.event_is_public_active(p_event_id)
          or public.is_event_org_admin(p_event_id)) then
    raise exception 'EVENT_NOT_OPEN' using errcode = 'P0001';
  end if;

  -- 3. Vagas por opção. RAISE aqui desfaz tudo que vier depois.
  perform public.reserve_option_counts(p_event_id, p_selections);

  -- 4. Cupom, se houver.
  if p_coupon_code is not null then
    v_coupon_id := public.consume_coupon(p_event_id, p_coupon_code);
  end if;

  -- 5. GRATUIDADE VERIFICADA NO SERVIDOR.
  --    Sem isto, qualquer um chamaria esta RPC com o ticket_id de um
  --    ingresso de R$ 100 e receberia inscrição 'confirmed' sem pagar.
  --    O front decide o caminho por selectedPriceCents, mas o front não
  --    é autoridade sobre preço.
  if p_ticket_id is not null then
    select t.price_cents into v_price
      from public.event_tickets t
     where t.id = p_ticket_id and t.event_id = p_event_id;
    if not found then
      raise exception 'TICKET_NOT_IN_EVENT' using errcode = 'P0001';
    end if;
  end if;

  v_efetivo := coalesce(v_price, 0);

  if v_coupon_id is not null then
    select c.discount_kind, c.discount_value into v_kind, v_value
      from public.coupons c where c.id = v_coupon_id;
    if v_kind = 'percent' then
      v_efetivo := greatest(0, v_efetivo - (v_efetivo * v_value / 100.0));
    else
      -- discount_value é em REAIS (numeric(12,2)); price_cents em centavos.
      -- O round() espelha literalmente o Math.round(value * 100) que os dois
      -- checkouts fazem (stripe-checkout:185, asaas-checkout:233).
      v_efetivo := greatest(0, v_efetivo - round(v_value * 100));
    end if;
  end if;

  -- floor(), NÃO round(), de propósito. O front calcula em REAIS com float
  -- e arredonda no fim (Math.round(preco * 100)); esta função calcula em
  -- CENTAVOS com numeric exato. Nas bordas de meio centavo o float pode
  -- cair de um lado e o numeric do outro — o front mandaria para o caminho
  -- gratuito e esta função recusaria, travando o participante sem
  -- explicação. Com floor, a regra vira "só recusa quem deve pelo menos 1
  -- centavo inteiro": como Math.round(0.5) é 1 e nunca 0, o front só
  -- escolhe o caminho gratuito quando o valor é < 0.5, e aí floor sempre dá
  -- 0. A divergência perigosa fica impossível por construção, e a proteção
  -- do passo 5 continua intacta (R$ 100 -> floor(10000) = 10000 > 0).
  if floor(v_efetivo) > 0 then
    -- Rollback automático: o cupom consumido no passo 4 e as opções
    -- reservadas no passo 3 voltam atrás junto com a transação.
    raise exception 'PAYMENT_REQUIRED' using errcode = 'P0001';
  end if;

  -- 6. A inscrição. user_id vem de auth.uid(), NUNCA de parâmetro.
  --    Precisa vir ANTES da reserva: ticket_reservations.registration_id
  --    tem FK não-deferrable para cá (031:73).
  insert into public.event_registrations
    (event_id, ticket_id, user_id, full_name, email, cpf, phone,
     birth_date, custom_fields, coupon_id, status)
  values
    (p_event_id, p_ticket_id, v_uid, p_full_name, p_email, p_cpf, p_phone,
     p_birth_date, coalesce(p_custom_fields, '{}'::jsonb), v_coupon_id, 'confirmed')
  returning * into v_reg;

  -- 7. A VAGA. Só quando há ingresso nomeado: evento sem ingresso
  --    cadastrado não tem contador para mexer, e o front manda
  --    p_ticket_id = null nesse caso (o "default-free" sintético).
  --
  --    TICKET_FULL sobe daqui sem catch, de propósito: o cliente precisa
  --    receber esse código para mostrar "ingresso esgotado", e o rollback
  --    da transação precisa levar junto a inscrição, o cupom e as opções.
  --    `quantity = 0` = ilimitado continua valendo — a convenção mora no
  --    WHERE de reserve_ticket_sold (031:183), não aqui.
  --
  --    DUPLICATE_HOLD (039) também pode subir daqui sem catch: participante
  --    com uma reserva 'held' de checkout PAGO abandonado no MESMO evento
  --    tentando pegar um ingresso GRATUITO do mesmo evento. Mesmo
  --    tratamento — erro sobe, transação desfaz tudo.
  if p_ticket_id is not null then
    perform public.reserve_ticket_sold(
      p_registration_id  => v_reg.id,
      p_event_id         => p_event_id,
      p_ticket_id        => p_ticket_id,
      p_quantity         => 1,
      -- expires_at é obrigatório na tabela, mas aqui é vestigial: a
      -- reserva nasce e morre nesta transação, confirmada no passo 8. O
      -- varredor de expiração só olha status = 'held' (índice parcial
      -- 031:106-108), então esta linha nunca é vista por ele.
      p_expires_at       => now(),
      -- As opções já foram reservadas no passo 3. Registrar isso aqui é
      -- só honestidade do livro-razão; não há caminho de release nesta
      -- função que fosse usá-lo.
      p_options_reserved => jsonb_array_length(coalesce(p_selections, '[]'::jsonb)) > 0,
      p_selections       => coalesce(p_selections, '[]'::jsonb)
    );

    -- 8. Reserva vira venda na hora: gratuito não tem pagamento pendente
    --    para esperar. Transfere reserved -> sold numa instrução só.
    --
    --    Só 'CONFIRMED' é aceito. A linha 'held' foi criada duas
    --    instruções atrás NESTA MESMA transação — 'ALREADY_CONFIRMED' e
    --    'NOT_FOUND' são tão impossíveis aqui quanto o antigo `false` já
    --    era, e 'RELEASED' mais ainda (nada nesta transação libera nada).
    --    Se acontecesse, `reserved` ficaria incrementado sem contrapartida
    --    em `sold` — vaga presa para sempre. Falhar alto é melhor que
    --    vazar contador em silêncio.
    v_confirm_result := public.confirm_ticket_reservation(v_reg.id);

    if v_confirm_result <> 'CONFIRMED' then
      raise exception 'RESERVATION_LOST' using errcode = 'P0001';
    end if;
  end if;

  return v_reg;
end;
$$;

revoke all on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) from public;
grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) to authenticated;

comment on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) is
  'Inscricao sem cobranca, atomica. Consome vaga desde a 034 (reserve + '
  'confirm_ticket_reservation). Desde a 039, trata o retorno text de '
  'confirm_ticket_reservation (4 estados) em vez de boolean -- so '
  'CONFIRMED e aceito, o resto vira RESERVATION_LOST.';
