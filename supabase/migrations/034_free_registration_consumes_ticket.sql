-- ============================================================
--  034_free_registration_consumes_ticket.sql
--
--  A inscrição gratuita passa a CONSUMIR VAGA.
--
--  O buraco que isto fecha: create_free_registration (033) inseria em
--  event_registrations e não encostava em event_tickets a não ser para
--  ler price_cents. Nenhum caminho gratuito mexia em `sold` — nem este,
--  nem o anterior a 033, que fazia reserve_option_counts + insert cru do
--  cliente. Resultado em produção: evento gratuito com quantity = 10
--  aceitava inscrição número 11, 12, 500. O `sold` só andava pelos
--  webhooks de pagamento, e ingresso gratuito nunca gera cobrança.
--
--  POR QUE DELEGAR ÀS RPCs DA 031, E NÃO ESCREVER `sold` DIRETO:
--  increment_ticket_sold (018) não checa capacidade nenhuma — é um
--  `set sold = sold + n` puro, feito para rodar DEPOIS de um pagamento
--  já confirmado, quando a vaga foi conferida lá atrás. Usá-la aqui
--  reintroduziria a corrida: dois participantes simultâneos passariam
--  os dois. reserve_ticket_sold (031) já resolve isso, já compara
--  sold + reserved contra quantity dentro do WHERE do UPDATE, já
--  levanta TICKET_FULL, e já preserva `quantity = 0` = ilimitado. As
--  três funções da 031 estavam ÓRFÃS desde que foram criadas: nada no
--  código as chamava, e por isso a coluna `reserved` vivia em 0.
--
--  ⚠ ORDEM: INSERT PRIMEIRO, RESERVA DEPOIS ⚠
--  A intuição diz "reserve antes de inserir". Não dá:
--  ticket_reservations.registration_id é NOT NULL REFERENCES
--  event_registrations(id) (031:73) e a FK não é DEFERRABLE, então
--  reservar antes da inscrição existir estoura foreign key violation.
--  A ordem abaixo é insert -> reserve -> confirm, e isso NÃO enfraquece
--  nada: a função é UMA transação. TICKET_FULL levantado depois do
--  insert desfaz o insert, o cupom consumido no passo 4 e as opções
--  reservadas no passo 3 — tudo junto, sem catch nenhum.
--
--  POR QUE reserve + confirm, E NÃO SÓ UM "vende direto":
--  o par existe para dar o mesmo caminho de código do fluxo pago. O
--  reserve faz o check-and-increment atômico em `reserved`; o confirm
--  transfere reserved -> sold numa instrução só. No gratuito os dois
--  acontecem na mesma transação, então `reserved` sobe e desce sem
--  nunca ser observável de fora — o efeito líquido é sold + 1, com a
--  checagem de capacidade da 031 de brinde. E fica a linha em
--  ticket_reservations como histórico de que a vaga saiu por aqui.
--
--  ADITIVO: um CREATE OR REPLACE de função existente, três funções
--  novas e dois gatilhos novos em event_registrations. Nenhuma tabela,
--  coluna ou policy é alterada. A ASSINATURA DE create_free_registration
--  NÃO MUDA — o front já chama com exatamente estes 10 parâmetros.
--
--  A segunda metade do arquivo (devolução da vaga no cancelamento e no
--  delete) é consequência direta da primeira: a partir do momento em que
--  o gratuito incrementa `sold`, alguém precisa devolvê-lo.
-- ============================================================

-- ------------------------------------------------------------
--  create_free_registration — agora consome vaga do ingresso.
--
--  Diferença para a versão da 033: os passos 7 e 8 no fim. O resto do
--  corpo é idêntico, reproduzido aqui porque CREATE OR REPLACE precisa
--  do corpo inteiro.
--
--  ⚠ ESPELHA A POLICY DE INSERT DE 003:194-202 ⚠
--  security definer IGNORA RLS. Sem os predicados abaixo, esta
--  função permitiria (1) inscrever terceiros, passando user_id
--  alheio, e (2) auto-inscrição em evento draft/paused. Por isso ela
--  CHAMA as mesmas funções que a policy chama, em vez de reescrever
--  a lógica, e NÃO aceita user_id como parâmetro — a identidade vem
--  de auth.uid(), que o cliente não controla.
--  Se a policy de 003:194-202 mudar, esta função precisa mudar junto.
--  O COMMENT ON POLICY recíproco continua valendo (posto pela 033).
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
  v_uid       uuid := auth.uid();
  v_coupon_id uuid;
  v_kind      public.discount_kind;
  v_value     numeric;
  v_price     integer := 0;
  v_efetivo   numeric;
  v_reg       public.event_registrations;
  v_confirmed boolean;
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

  -- 7. A VAGA (novidade da 034). Só quando há ingresso nomeado: evento
  --    sem ingresso cadastrado não tem contador para mexer, e o front
  --    manda p_ticket_id = null nesse caso (o "default-free" sintético).
  --
  --    TICKET_FULL sobe daqui sem catch, de propósito: o cliente precisa
  --    receber esse código para mostrar "ingresso esgotado", e o rollback
  --    da transação precisa levar junto a inscrição, o cupom e as opções.
  --    `quantity = 0` = ilimitado continua valendo — a convenção mora no
  --    WHERE de reserve_ticket_sold (031:183), não aqui.
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
    v_confirmed := public.confirm_ticket_reservation(v_reg.id);

    -- Impossível pelo fluxo acima (a linha 'held' foi criada duas
    -- instruções atrás, na mesma transação). Se acontecesse, `reserved`
    -- ficaria incrementado sem contrapartida em `sold` — vaga presa para
    -- sempre. Falhar alto é melhor que vazar contador em silêncio.
    if not v_confirmed then
      raise exception 'RESERVATION_LOST' using errcode = 'P0001';
    end if;
  end if;

  return v_reg;
end;
$$;

-- ─── Grants ─────────────────────────────────────────────────
-- Reafirmados porque CREATE OR REPLACE preserva os grants existentes,
-- mas deixar explícito evita que um replay em base limpa (onde a função
-- nasceria sem grant) publique algo inacessível ao cliente.
--
-- reserve_ticket_sold e confirm_ticket_reservation seguem SEM grant para
-- authenticated, e devem seguir: as duas são service_role-only (031:222,
-- 031:280). A chamada aninhada aqui funciona porque create_free_registration
-- é security definer — o corpo executa com os privilégios do DONO dela, não
-- os do participante. Mesmo mecanismo que já vale para consume_coupon
-- (033:300-304). Expor qualquer uma das duas ao cliente permitiria inflar
-- `reserved` de um evento alheio até esgotá-lo sem uma inscrição sequer.
revoke all on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) from public;
grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) to authenticated;

comment on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) is
  'Inscricao sem cobranca, atomica. Desde a migration 034 CONSUME VAGA: '
  'chama reserve_ticket_sold + confirm_ticket_reservation (031) quando ha '
  'p_ticket_id, e propaga TICKET_FULL para o cliente. Ordem interna e '
  'insert-depois-reserva porque ticket_reservations.registration_id tem FK '
  'nao-deferrable para event_registrations.';

-- ============================================================
--  DEVOLUÇÃO DA VAGA NO CANCELAMENTO
--
--  Necessário A PARTIR DESTA MIGRATION. Antes da 034 o caminho
--  gratuito nunca incrementava `sold`, então cancelar uma inscrição
--  gratuita não tinha nada para devolver. Agora tem: create_free_registration
--  transfere reserved -> sold no passo 8, e sem este gatilho a vaga de
--  uma inscrição gratuita cancelada ficaria contada para sempre —
--  evento com quantity = 10 esgotaria com 10 cancelamentos e zero
--  participantes.
--
--  POR QUE UM TRIGGER, E NÃO UMA CHAMADA NO CLIENTE:
--  decrement_ticket_sold (025) é service_role-only e o cancelamento
--  parte do participante (update em event_registrations, permitido pela
--  policy de RLS). Não há Edge Function no caminho. O trigger é o único
--  lugar que vê a transição e roda com privilégio suficiente.
--
--  ⚠⚠ POR QUE O GATILHO NÃO PODE AGIR EM TODA SAÍDA DE 'confirmed' ⚠⚠
--  Os três caminhos de ESTORNO já devolvem a vaga por conta própria, e
--  fazem isso em DUAS instruções: primeiro `update event_registrations
--  set status = 'cancelled'`, depois `rpc decrement_ticket_sold`.
--    - stripe-webhook/index.ts:335-348
--    - asaas-webhook/index.ts:491-503
--    - reconcile-payments/index.ts:1146-1159
--  Um trigger que devolvesse a vaga em toda saída de 'confirmed'
--  dispararia no primeiro update e o RPC decrementaria de novo logo
--  depois: DUPLA DEVOLUÇÃO. Pior, os valores nem batem — o trigger
--  devolveria 1 e o webhook devolve `quantity`, que vem do metadata da
--  cobrança e pode ser > 1. Um estorno de 1 ingresso zeraria 2 do
--  contador.
--  Por isso a guarda de transição é ampla (qualquer saída de
--  'confirmed'), mas a AÇÃO é estreita: só devolve quem tem reserva.
--
--  A trava é a linha de ticket_reservations:
--  só devolve quem foi contado POR ESTE mecanismo. A 034 cria uma
--  reserva 'confirmed' por inscrição gratuita; as inscrições pagas de
--  hoje NÃO têm linha nenhuma (reserve_ticket_sold segue órfã no
--  caminho pago). Logo o trigger age no gratuito e passa batido no
--  pago, onde o webhook continua sendo o dono da devolução.
--
--  ⚠ QUANDO O CAMINHO PAGO PASSAR A RESERVAR (Etapa 4), os webhooks
--  precisarão PARAR de chamar decrement_ticket_sold, senão a dupla
--  devolução volta — aí pela outra ponta. Está anotado no comentário
--  do trigger, no catálogo.
--
--  IDEMPOTÊNCIA: pelo mesmo mecanismo do resto do projeto — o
--  `status = 'confirmed'` mora no WHERE do UPDATE em
--  ticket_reservations. O segundo cancelamento (ou um update repetido
--  do mesmo status) não encontra linha, não decrementa nada e sai.
--
--  DOIS GATILHOS, UMA LÓGICA:
--    - UPDATE: qualquer SAÍDA de 'confirmed', não só para 'cancelled'.
--      O enum registration_status é ('pending','confirmed','cancelled',
--      'waitlist') (003:13); confirmed -> pending e confirmed ->
--      waitlist também deixariam a vaga contada sem participante
--      confirmado. A guarda é `new.status <> 'confirmed'`, que cobre os
--      três de uma vez e não precisa de manutenção se o enum crescer.
--    - DELETE: apagar a inscrição não passa por UPDATE nenhum. Precisa
--      ser BEFORE: a FK ticket_reservations.registration_id é ON DELETE
--      CASCADE (031:73), então num AFTER a linha da reserva já teria
--      sumido e não haveria `quantity` para ler.
--  O corpo comum vive em release_ticket_hold(); as duas funções de
--  trigger são só a guarda mais a chamada.
-- ============================================================

-- ------------------------------------------------------------
--  release_ticket_hold — o trabalho de verdade, chamado pelos dois
--  gatilhos. Nomes conferidos contra a 031: quantity (031:81),
--  resolved_at (031:93) e 'released' no CHECK de status (031:90), que
--  é a mesma transição que release_ticket_reservation faz em 031:310.
-- ------------------------------------------------------------
create or replace function public.release_ticket_hold(
  p_registration_id uuid,
  p_ticket_id       uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qty integer;
begin
  -- Sem ingresso nomeado não há contador para mexer.
  if p_ticket_id is null then
    return;
  end if;

  -- Consome a reserva E serve de trava de idempotência na mesma
  -- instrução: 'confirmed' no WHERE garante que só a primeira passagem
  -- afeta linha. Ausência de linha significa "esta inscrição não foi
  -- contada pela 034" — caso das inscrições pagas de hoje, cuja
  -- devolução é do webhook. Sai sem tocar em sold.
  --
  -- No caminho do DELETE este UPDATE é efêmero (a linha morre logo
  -- depois, pelo cascade), mas é ele que entrega o `quantity` e a
  -- garantia de passagem única. Vale o custo.
  update public.ticket_reservations
     set status = 'released', resolved_at = now()
   where registration_id = p_registration_id
     and status = 'confirmed'
  returning quantity into v_qty;

  if not found then
    return;
  end if;

  -- greatest(..., 0): o contador nunca fica negativo, nem se algum
  -- caminho anterior já o tiver zerado. Mesma proteção que
  -- decrement_ticket_sold (025) e confirm_ticket_reservation (031:270).
  update public.event_tickets
     set sold = greatest(coalesce(sold, 0) - coalesce(v_qty, 1), 0)
   where id = p_ticket_id;
end;
$$;

revoke all on function public.release_ticket_hold(uuid, uuid) from public;

comment on function public.release_ticket_hold(uuid, uuid) is
  'Corpo comum dos gatilhos de devolucao de vaga (migration 034). So age '
  'quando existe ticket_reservations com status confirmed para a '
  'inscricao -- e essa a trava que evita dupla devolucao com o '
  'decrement_ticket_sold dos webhooks de estorno (stripe-webhook:344, '
  'asaas-webhook:499, reconcile-payments:1155). QUANDO O CAMINHO PAGO '
  'PASSAR A CHAMAR reserve_ticket_sold, remover aquelas tres chamadas de '
  'decrement_ticket_sold ou a dupla devolucao volta.';

-- ------------------------------------------------------------
--  Gatilho de UPDATE: qualquer saída de 'confirmed'.
-- ------------------------------------------------------------
create or replace function public.release_ticket_on_registration_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Só a TRANSIÇÃO PARA FORA de 'confirmed'. Um update que reescreve o
  -- mesmo status não devolve vaga nenhuma. Cobre cancelled, pending e
  -- waitlist com uma condição só.
  if not (old.status = 'confirmed' and new.status <> 'confirmed') then
    return new;
  end if;

  perform public.release_ticket_hold(new.id, new.ticket_id);
  return new;
end;
$$;

revoke all on function public.release_ticket_on_registration_cancel() from public;

comment on function public.release_ticket_on_registration_cancel() is
  'Trigger AFTER UPDATE da migration 034: devolve sold quando a inscricao '
  'sai de confirmed para qualquer outro status. Delega em '
  'release_ticket_hold.';

-- ------------------------------------------------------------
--  Gatilho de DELETE: precisa ser BEFORE (ver cabeçalho).
-- ------------------------------------------------------------
create or replace function public.release_ticket_on_registration_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Sem guarda de status aqui, de propósito: a autoridade sobre "esta
  -- vaga foi contada?" é o status da RESERVA, não o da inscrição, e
  -- release_ticket_hold já exige 'confirmed' nela. Apagar uma inscrição
  -- já cancelada encontra a reserva em 'released' e não faz nada —
  -- justamente o que se quer, sem duplicar a regra em dois lugares.
  perform public.release_ticket_hold(old.id, old.ticket_id);
  return old;
end;
$$;

revoke all on function public.release_ticket_on_registration_delete() from public;

comment on function public.release_ticket_on_registration_delete() is
  'Trigger BEFORE DELETE da migration 034: devolve sold ao apagar uma '
  'inscricao que ainda segurava vaga. BEFORE porque a FK '
  'ticket_reservations.registration_id e ON DELETE CASCADE (031:73) -- '
  'num AFTER a linha da reserva ja teria sumido e nao haveria quantity '
  'para ler. Delega em release_ticket_hold.';

-- ------------------------------------------------------------
--  Os gatilhos.
-- ------------------------------------------------------------
-- `of status` + `when` para o gatilho nem ser avaliado em update que
-- não mexe no status (o caminho comum: edição de custom_fields).
-- AFTER, não BEFORE: a devolução só faz sentido depois que a linha
-- realmente mudou de estado. Convive com event_registrations_set_updated_at
-- (003:466), que é BEFORE UPDATE e só carimba timestamp.
drop trigger if exists event_registrations_release_ticket on public.event_registrations;
create trigger event_registrations_release_ticket
  after update of status on public.event_registrations
  for each row
  when (old.status is distinct from new.status)
  execute procedure public.release_ticket_on_registration_cancel();

-- BEFORE DELETE: ver o comentário da função. Sem `when` — a decisão
-- depende do status da reserva, que só dá para consultar no corpo.
drop trigger if exists event_registrations_release_ticket_on_delete on public.event_registrations;
create trigger event_registrations_release_ticket_on_delete
  before delete on public.event_registrations
  for each row
  execute procedure public.release_ticket_on_registration_delete();
