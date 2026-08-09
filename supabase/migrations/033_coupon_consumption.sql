-- ============================================================
--  033_coupon_consumption.sql
--
--  DOIS BUGS, UMA CORREÇÃO. Separados, um é regressão e o outro é
--  inerte — por isso vão juntos:
--
--  (a) coupons.used_count NUNCA é incrementado. Nenhum trigger,
--      nenhuma função, nenhuma constraint liga used_count a
--      max_uses. Confirmado por varredura de todos os .sql do
--      projeto: validate_coupon (003:498) é `stable`, incapaz de
--      escrever. Resultado: max_uses é decorativo e um cupom de uso
--      único vale infinitas vezes.
--
--  (b) O front lia `coupons` direto (select *), mas a policy
--      "coupons: membros leem" (003:323) exige organization_id in
--      user_org_ids(), que vem de organization_members. O
--      participante comum não tem linha lá, então TODO cupom
--      voltava vazio e ele via "Cupom inválido ou inativo". A
--      validate_coupon existe desde a 003 exatamente para isso (ver
--      comentário em 003:495-496) e nunca foi usada.
--
--  Enquanto (b) existia, (a) não causava prejuízo: ninguém
--  conseguia aplicar cupom. Corrigir só (b) DESTRAVARIA (a) com
--  dinheiro real em jogo.
-- ============================================================

-- O caminho gratuito não cria linha em payments, então o cupom usado
-- numa inscrição de 100% não teria onde ser registrado — e não
-- haveria como devolver o uso no cancelamento/estorno.
alter table public.event_registrations
  add column if not exists coupon_id uuid
  references public.coupons(id) on delete set null;

-- ------------------------------------------------------------
--  validate_coupon — contrato NOVO, com motivo.
--
--  DROP obrigatório: o Postgres não permite trocar o tipo de retorno
--  com CREATE OR REPLACE. Seguro porque a função está órfã — não há
--  nenhum chamador no código até este commit.
-- ------------------------------------------------------------
drop function if exists public.validate_coupon(uuid, text);

create function public.validate_coupon(
  p_event_id uuid,
  p_code     text
)
returns table (
  valid          boolean,
  reason         text,
  discount_kind  public.discount_kind,
  discount_value numeric
)
language sql
security definer
stable
set search_path = ''
as $$
  with alvo as (
    select c.*
    from public.events e
    left join public.coupons c
      on  upper(c.code) = upper(p_code)
      and (c.event_id = e.id
           or (c.event_id is null and c.organization_id = e.organization_id))
    where e.id = p_event_id
    -- PRECEDÊNCIA: cupom específico do evento vence o cupom geral da
    -- organização com o mesmo código. O original fazia `limit 1` SEM
    -- order by (003:526) — qual linha vinha era decisão do planejador.
    order by (c.event_id is not null) desc nulls last
    limit 1
  )
  select
    coalesce(
      a.id is not null
      and a.active
      and (a.starts_at  is null or a.starts_at  <= now())
      and (a.expires_at is null or a.expires_at >  now())
      -- max_uses NULL = ILIMITADO. Contrato preservado dos 4 leitores
      -- originais (003:517, stripe-checkout:180, asaas-checkout:229,
      -- EventRegistrationModal:148).
      and (a.max_uses   is null or a.used_count <  a.max_uses),
      false),
    case
      when a.id is null                                            then 'not_found'
      when not a.active                                            then 'inactive'
      when a.starts_at  is not null and a.starts_at  >  now()      then 'not_started'
      when a.expires_at is not null and a.expires_at <= now()      then 'expired'
      when a.max_uses   is not null and a.used_count >= a.max_uses then 'exhausted'
      else 'ok'
    end,
    a.discount_kind,
    a.discount_value
  from alvo a;
$$;

revoke all on function public.validate_coupon(uuid, text) from public;
grant execute on function public.validate_coupon(uuid, text) to anon, authenticated;

-- ------------------------------------------------------------
--  consume_coupon — check-and-increment ATÔMICO.
--
--  Mesmo padrão de reserve_option_counts (021): a condição de limite
--  vive no WHERE do UPDATE. Duas chamadas concorrentes serializam no
--  lock da linha, e a segunda enxerga o used_count já incrementado
--  pela primeira.
--
--  NÃO é exposta a anon/authenticated de propósito: queimar usos de
--  cupom com um laço de chamadas esgotaria a campanha inteira de um
--  organizador sem ninguém se inscrever. O caminho gratuito a alcança
--  apenas por dentro de create_free_registration, onde "consumir sem
--  inscrever" não existe como operação.
-- ------------------------------------------------------------
create or replace function public.consume_coupon(
  p_event_id uuid,
  p_code     text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.coupons c
     set used_count = c.used_count + 1
   where c.id = (
           select c2.id
           from public.events e
           left join public.coupons c2
             on  upper(c2.code) = upper(p_code)
             and (c2.event_id = e.id
                  or (c2.event_id is null and c2.organization_id = e.organization_id))
           where e.id = p_event_id
           order by (c2.event_id is not null) desc nulls last
           limit 1)
     and c.active
     and (c.starts_at  is null or c.starts_at  <= now())
     and (c.expires_at is null or c.expires_at >  now())
     and (c.max_uses   is null or c.used_count <  c.max_uses)
  returning c.id into v_id;

  if not found then
    raise exception 'COUPON_UNAVAILABLE' using errcode = 'P0001';
  end if;

  return v_id;
end;
$$;

-- ------------------------------------------------------------
--  release_coupon_use — devolve um uso.
--
--  greatest(0, ...) impede negativo, mas NÃO torna a função
--  idempotente: chamar duas vezes devolve dois usos. Os chamadores
--  usam guard de status (mesmo padrão dos webhooks: só quem
--  transiciona a linha produz efeito) para não repetir.
-- ------------------------------------------------------------
create or replace function public.release_coupon_use(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.coupons
     set used_count = greatest(0, used_count - 1)
   where id = p_coupon_id;
$$;

-- ------------------------------------------------------------
--  create_free_registration — inscrição SEM cobrança, atômica.
--
--  Cobre os dois casos: ingresso gratuito, e ingresso pago cujo
--  cupom zerou o total. Cupom é opcional — um caminho só, de
--  propósito: manter dois deixaria o caminho sem cupom com o
--  vazamento descrito abaixo.
--
--  POR QUE UMA RPC, E NÃO insert + rpc do cliente:
--  o front chamava reserve_option_counts e DEPOIS inseria, em duas
--  idas separadas. Falha no insert deixava a vaga da opção presa
--  para sempre. Aqui tudo é uma transação: qualquer RAISE desfaz
--  cupom, opções e inscrição juntos, sem catch nenhum.
--
--  ⚠ ESPELHA A POLICY DE INSERT DE 003:194-202 ⚠
--  security definer IGNORA RLS. Sem os predicados abaixo, esta
--  função permitiria (1) inscrever terceiros, passando user_id
--  alheio, e (2) auto-inscrição em evento draft/paused. Por isso ela
--  CHAMA as mesmas funções que a policy chama, em vez de reescrever
--  a lógica, e NÃO aceita user_id como parâmetro — a identidade vem
--  de auth.uid(), que o cliente não controla.
--  Se a policy de 003:194-202 mudar, esta função precisa mudar
--  junto. Há um COMMENT ON POLICY recíproco no fim deste arquivo.
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
  insert into public.event_registrations
    (event_id, ticket_id, user_id, full_name, email, cpf, phone,
     birth_date, custom_fields, coupon_id, status)
  values
    (p_event_id, p_ticket_id, v_uid, p_full_name, p_email, p_cpf, p_phone,
     p_birth_date, coalesce(p_custom_fields, '{}'::jsonb), v_coupon_id, 'confirmed')
  returning * into v_reg;

  return v_reg;
end;
$$;

-- ─── Grants ─────────────────────────────────────────────────
-- consume/release ficam FORA do alcance do cliente. A chamada aninhada
-- dentro de create_free_registration executa com os privilégios do DONO
-- da função externa, então não precisa de grant para anon/authenticated.
revoke all on function public.consume_coupon(uuid, text) from public;
grant execute on function public.consume_coupon(uuid, text) to service_role;

revoke all on function public.release_coupon_use(uuid) from public;
grant execute on function public.release_coupon_use(uuid) to service_role;

revoke all on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) from public;
grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) to authenticated;

-- ─── Comentário recíproco na policy ─────────────────────────
-- Fica no catálogo do Postgres (visível em \d+ e no dashboard), não só
-- neste arquivo. Escolhi COMMENT ON POLICY em vez de editar a 003 porque
-- aquela migration já rodou em produção: editá-la mudaria o arquivo sem
-- mudar o banco, criando divergência entre o histórico e a realidade.
comment on policy "registrations: auto-inscrição em evento público OR admin"
  on public.event_registrations is
  'ESPELHADA em public.create_free_registration (migration 033): aquela funcao e security definer e IGNORA esta policy, por isso reimplementa estes mesmos predicados no corpo, chamando event_is_public_active e is_event_org_admin. Mudou aqui? Mude la tambem, ou as duas divergem em silencio.';
