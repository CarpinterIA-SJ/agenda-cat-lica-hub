-- ============================================================
--  021_event_option_counts.sql
--  Fase C: limite de vagas POR OPÇÃO de campo customizado.
--
--  Modelo de contagem escolhido: (b) "espelha o sold" — a vaga é
--  contabilizada na CONFIRMAÇÃO (gratuito grava direto; pago conta no
--  webhook succeeded), igual a increment_ticket_sold. Não há reserva
--  no checkout nem release no fail/cancel.
--
--  Estrutura de limite (Opção A, aditiva): o limite mora em
--  events.custom_fields[].option_limits = { "<label>": <int> }.
--  Campos/opções SEM option_limits = vagas ILIMITADAS (comportamento
--  atual intacto, retrocompatível com Fase A/B).
--
--  ADITIVO: apenas CREATE TABLE + CREATE FUNCTION + policies.
--  Nenhuma tabela existente é alterada.
-- ============================================================

create table if not exists public.event_option_counts (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  field_id     text not null,
  option_label text not null,
  count        integer not null default 0,
  unique (event_id, field_id, option_label)
);

-- O unique acima já cria o índice usado nas buscas (event_id, field_id, option_label).

alter table public.event_option_counts enable row level security;

-- Leitura pública: o formulário precisa saber quais opções esgotaram
-- para marcá-las "(esgotado)". Escrita é exclusiva das RPCs abaixo
-- (security definer), portanto NÃO há policy de insert/update/delete.
drop policy if exists "option_counts: leitura pública" on public.event_option_counts;
create policy "option_counts: leitura pública"
  on public.event_option_counts
  for select
  using (true);

-- ------------------------------------------------------------
--  reserve_option_counts — reserva ATÔMICA com enforcement.
--
--  Para cada opção escolhida que tem limite em events.custom_fields:
--    incrementa se count < limite; se já cheia, RAISE (rollback de
--    TODAS as opções desta chamada — ninguém fica com vaga parcial).
--  Opções sem limite são ignoradas (ilimitadas).
--
--  Usada pelo caminho GRATUITO (pode rejeitar ANTES de gravar a
--  inscrição). p_selections = jsonb array de
--    [{ "field_id": "...", "option_label": "..." }, ...]
-- ------------------------------------------------------------
create or replace function public.reserve_option_counts(
  p_event_id   uuid,
  p_selections jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sel     jsonb;
  v_fid   text;
  v_opt   text;
  v_limit int;
  v_new   int;
begin
  for sel in select * from jsonb_array_elements(coalesce(p_selections, '[]'::jsonb))
  loop
    v_fid := sel->>'field_id';
    v_opt := sel->>'option_label';
    if v_fid is null or v_opt is null then
      continue;
    end if;

    -- Limite autoritativo do schema (nunca confia no cliente).
    select (f->'option_limits'->>v_opt)::int
      into v_limit
      from public.events e,
           jsonb_array_elements(e.custom_fields) f
     where e.id = p_event_id and f->>'id' = v_fid
     limit 1;

    if v_limit is null then
      continue; -- opção sem limite: vagas ilimitadas
    end if;

    -- Check-and-increment atômico: o ON CONFLICT serializa concorrentes
    -- na mesma (event, field, option); o WHERE barra o estouro do limite.
    insert into public.event_option_counts (event_id, field_id, option_label, count)
    values (p_event_id, v_fid, v_opt, 1)
    on conflict (event_id, field_id, option_label)
    do update set count = public.event_option_counts.count + 1
      where public.event_option_counts.count < v_limit
    returning count into v_new;

    -- WHERE falso no conflito => 0 linhas => FOUND false => esgotado.
    if not found then
      raise exception 'OPTION_FULL:%:%', v_fid, v_opt using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

revoke all on function public.reserve_option_counts(uuid, jsonb) from public;
-- anon: inscrição gratuita pode ser anônima. authenticated: logada.
grant execute on function public.reserve_option_counts(uuid, jsonb)
  to anon, authenticated, service_role;

-- ------------------------------------------------------------
--  tally_option_counts — incremento INCONDICIONAL (sem enforcement).
--
--  Espelha increment_ticket_sold: contabiliza uma venda JÁ confirmada
--  (pagamento final) e NUNCA rejeita — o comprador já pagou. Eventual
--  estouro de limite na janela checkout→confirmação é tolerado, igual
--  ao sold de ingresso. Conta apenas opções COM limite.
--
--  Usada SÓ pelo backend (webhook/reconcile).
-- ------------------------------------------------------------
create or replace function public.tally_option_counts(
  p_event_id   uuid,
  p_selections jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sel     jsonb;
  v_fid   text;
  v_opt   text;
  v_limit int;
begin
  for sel in select * from jsonb_array_elements(coalesce(p_selections, '[]'::jsonb))
  loop
    v_fid := sel->>'field_id';
    v_opt := sel->>'option_label';
    if v_fid is null or v_opt is null then
      continue;
    end if;

    select (f->'option_limits'->>v_opt)::int
      into v_limit
      from public.events e,
           jsonb_array_elements(e.custom_fields) f
     where e.id = p_event_id and f->>'id' = v_fid
     limit 1;

    if v_limit is null then
      continue; -- só contabiliza opções com limite
    end if;

    insert into public.event_option_counts (event_id, field_id, option_label, count)
    values (p_event_id, v_fid, v_opt, 1)
    on conflict (event_id, field_id, option_label)
    do update set count = public.event_option_counts.count + 1;
  end loop;
end;
$$;

revoke all on function public.tally_option_counts(uuid, jsonb) from public;
grant execute on function public.tally_option_counts(uuid, jsonb) to service_role;
