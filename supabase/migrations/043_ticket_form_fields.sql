-- ============================================================
--  043_ticket_form_fields.sql
--  Enriquecimento do formulário de ingresso — escopo final: descrição +
--  janela de vendas. Aditiva: toda nullable, nenhuma coluna existente é
--  alterada. visibility já existe (003), não entra aqui.
--
--  FORA DESTA MIGRATION (decisão explícita):
--    min_per_order / max_per_order — sem seletor de quantidade no front,
--    seriam coluna morta desde o dia 1 (pass_fees e status já provam que
--    isso não envelhece bem).
--    waitlist_enabled, status publicado/não publicado, toggle de taxa —
--    fora do escopo final desta feature.
-- ============================================================

alter table public.event_tickets
  add column if not exists description text;

alter table public.event_tickets
  add column if not exists sales_start_at timestamptz;

alter table public.event_tickets
  add column if not exists sales_end_at timestamptz;

-- início <= fim quando ambos setados. Null em qualquer um = sem limite
-- naquele lado (mesma convenção de payment_deadline_minutes/010 e
-- quantity=0="ilimitado" desde a 003).
alter table public.event_tickets
  add constraint event_tickets_sales_window_check
  check (sales_start_at is null or sales_end_at is null or sales_start_at <= sales_end_at);

comment on column public.event_tickets.description is
  'Texto livre opcional do organizador, exibido na tela de compra do ingresso.';
comment on column public.event_tickets.sales_start_at is
  'Início da janela de vendas. NULL = vendas abertas desde já (comportamento anterior a esta migration).';
comment on column public.event_tickets.sales_end_at is
  'Fim da janela de vendas. NULL = sem data de encerramento (comportamento anterior a esta migration).';

-- ------------------------------------------------------------
--  create_free_registration — acompanha janela de vendas.
--
--  Corpo idêntico ao da 039 (última redefinição real — 034 não é a
--  versão final), exceto: v_sales_start/v_sales_end na declaração, o
--  select do passo 5 trazendo as duas colunas novas, e duas checagens
--  novas logo depois do TICKET_NOT_IN_EVENT. Bypass de organizador/admin
--  do evento nas duas, mesmo padrão do gate de evento fechado no passo 2
--  (is_event_org_admin) — decisão explícita: admin testa o registro antes
--  da janela abrir ou depois que fecha. Assinatura NÃO muda — o front
--  chama com os mesmos 10 parâmetros de sempre.
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
  v_sales_start    timestamptz;
  v_sales_end      timestamptz;
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

  -- 2. Espelho da policy 003:194-202 (ver bloco de comentário da 034).
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

  -- 5. GRATUIDADE VERIFICADA NO SERVIDOR + janela de vendas (043, novo).
  if p_ticket_id is not null then
    select t.price_cents, t.sales_start_at, t.sales_end_at
      into v_price, v_sales_start, v_sales_end
      from public.event_tickets t
     where t.id = p_ticket_id and t.event_id = p_event_id;
    if not found then
      raise exception 'TICKET_NOT_IN_EVENT' using errcode = 'P0001';
    end if;

    -- Janela de vendas (043) — mesmo predicado do bloco 7c do
    -- asaas-checkout, aqui do lado gratuito. Bypass de organizador/admin
    -- do evento, mesmo padrão do passo 2. RAISE desfaz cupom (4) e
    -- opções (3) junto, mesma mecânica de TICKET_FULL/PAYMENT_REQUIRED
    -- logo abaixo.
    if v_sales_start is not null and now() < v_sales_start
       and not public.is_event_org_admin(p_event_id) then
      raise exception 'SALES_NOT_STARTED' using errcode = 'P0001';
    end if;
    if v_sales_end is not null and now() > v_sales_end
       and not public.is_event_org_admin(p_event_id) then
      raise exception 'SALES_ENDED' using errcode = 'P0001';
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

  -- floor(), NÃO round(), de propósito (ver 034 pro raciocínio completo).
  if floor(v_efetivo) > 0 then
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

  -- 7. A VAGA. Só quando há ingresso nomeado.
  if p_ticket_id is not null then
    perform public.reserve_ticket_sold(
      p_registration_id  => v_reg.id,
      p_event_id         => p_event_id,
      p_ticket_id        => p_ticket_id,
      p_quantity         => 1,
      p_expires_at       => now(),
      p_options_reserved => jsonb_array_length(coalesce(p_selections, '[]'::jsonb)) > 0,
      p_selections       => coalesce(p_selections, '[]'::jsonb)
    );

    -- 8. Reserva vira venda na hora: gratuito não tem pagamento pendente
    --    para esperar. Transfere reserved -> sold numa instrução só.
    v_confirm_result := public.confirm_ticket_reservation(v_reg.id);

    if v_confirm_result <> 'CONFIRMED' then
      raise exception 'RESERVATION_LOST' using errcode = 'P0001';
    end if;
  end if;

  return v_reg;
end;
$$;

-- Grants reafirmados, mesmo padrão da 034/039 — CREATE OR REPLACE preserva,
-- mas deixar explícito evita função sem grant num replay em base limpa.
revoke all on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) from public;
grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) to authenticated;

comment on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text) is
  'Inscricao sem cobranca, atomica. Consome vaga desde a 034. Trata retorno '
  'text de confirm_ticket_reservation desde a 039. Desde a 043, valida '
  'janela de vendas do ingresso (sales_start_at/sales_end_at) no passo 5, '
  'com bypass de organizador/admin do evento (is_event_org_admin) -- '
  'SALES_NOT_STARTED / SALES_ENDED.';
