-- ============================================================
--  035 — Restringe o UPDATE do participante em event_registrations
-- ============================================================
--
--  PROBLEMA
--  A policy de UPDATE criada em 003 (003_domain_tables.sql:206,
--  "registrations: dono ou admin atualiza") exige apenas
--  `user_id = auth.uid()` no USING e no WITH CHECK. Não restringe coluna
--  nem transição. Consequência: o próprio participante pode, pela API
--  REST, mandar `status = 'confirmed'` numa inscrição 'pending' e obter
--  ingresso válido sem pagar — o fluxo pago nasce 'pending'
--  (stripe-checkout:320, asaas-checkout:341) e só deveria ser promovido
--  pelos webhooks.
--
--  SOLUÇÃO
--  Separar a policy única em duas, com poderes diferentes:
--
--    (1) admin da organização dona  → poder atual, inalterado.
--    (2) dono não-admin             → APENAS saída para 'cancelled',
--                                     a partir de 'confirmed' ou 'pending'.
--
--  Por que RLS resolve isto sem trigger: numa policy de UPDATE o USING é
--  avaliado contra a linha ANTIGA e o WITH CHECK contra a NOVA. Então
--  `USING (status in ('confirmed','pending'))` + `WITH CHECK (status =
--  'cancelled')` expressa exatamente as duas transições pedidas.
--
--  NÃO AFETA os webhooks: stripe-webhook, asaas-webhook, stripe-checkout,
--  asaas-checkout e reconcile-payments usam SUPABASE_SERVICE_ROLE_KEY, e
--  service_role ignora RLS. A promoção pending → confirmed continua
--  funcionando por lá.
--
--  NÃO AFETA o gatilho da 034: event_registrations_release_ticket é AFTER
--  UPDATE OF status e continua devolvendo a vaga quando o status sai de
--  'confirmed'. A transição confirmed → cancelled do participante, que é
--  o caminho do botão "Cancelar inscrição", segue permitida.
--
--  CUSTO ACEITO — leia antes de aplicar
--  Com esta migration o dono não-admin passa a NÃO conseguir atualizar
--  nenhum outro campo da própria inscrição (full_name, phone,
--  custom_fields) sem no mesmo update mandar status = 'cancelled'.
--  Hoje isso não quebra nada: o único UPDATE de event_registrations
--  partindo do front é o botão de cancelamento
--  (use-registrations.ts:112, useUpdateRegistrationStatus). O botão
--  "Editar dados" da tela de detalhe não tem handler. Se a edição de
--  custom_fields pelo participante for construída depois, ela precisará
--  de uma policy adicional — e aí a regra de transição terá de migrar
--  para um trigger BEFORE UPDATE, porque o WITH CHECK não enxerga OLD.
--
-- ============================================================

-- ------------------------------------------------------------
--  (1) Remove TODA policy de UPDATE existente na tabela.
-- ------------------------------------------------------------
-- Drop dinâmico, não `drop policy if exists "<nome>"`, de propósito: o
-- nome do arquivo 003 e o nome no catálogo do banco já divergiram uma vez
-- (ver o comentário em 033_coupon_consumption.sql:320-327, onde a policy
-- de INSERT aparece como "registrations: inscricao ou admin"). Um drop por
-- nome literal que erra o nome vira no-op silencioso — e como policies são
-- OR, a permissiva antiga sobreviveria ao lado da nova restritiva,
-- anulando esta migration inteira sem erro nenhum.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
      from pg_policies
     where schemaname = 'public'
       and tablename  = 'event_registrations'
       and cmd        = 'UPDATE'
  loop
    raise notice '035: removendo policy de UPDATE "%"', pol.policyname;
    execute format(
      'drop policy %I on public.event_registrations',
      pol.policyname
    );
  end loop;
end;
$$;

-- ------------------------------------------------------------
--  (2) Admin da organização dona: poder inalterado.
-- ------------------------------------------------------------
-- Mesmos predicados da policy original de 003, menos o ramo do dono.
-- Continua podendo mover qualquer inscrição para qualquer status —
-- inclusive reativar uma cancelada e confirmar uma pendente na mão.
create policy "registrations: admin da org atualiza"
  on public.event_registrations for update
  to authenticated
  using       (public.is_event_org_admin(event_id))
  with check  (public.is_event_org_admin(event_id));

-- ------------------------------------------------------------
--  (3) Dono não-admin: só cancelamento.
-- ------------------------------------------------------------
-- USING  → estado ANTIGO permitido: 'confirmed' ou 'pending'.
-- CHECK  → estado NOVO permitido: 'cancelled', e só ele.
--
-- O `user_id = auth.uid()` aparece nos dois lados para o dono não poder
-- reatribuir a inscrição a outra pessoa no mesmo update.
--
-- Fica de fora, de propósito: 'waitlist' → 'cancelled'. A saída da fila
-- de espera é event_waitlist, tratada pela RPC waitlist_leave
-- (migration 015), não por esta tabela.
create policy "registrations: dono cancela a propria"
  on public.event_registrations for update
  to authenticated
  using (
    user_id = auth.uid()
    and status in ('confirmed', 'pending')
  )
  with check (
    user_id = auth.uid()
    and status = 'cancelled'
  );

comment on policy "registrations: dono cancela a propria"
  on public.event_registrations is
  'Migration 035: o dono nao-admin so pode cancelar. USING vale para a linha ANTIGA (confirmed|pending), WITH CHECK para a NOVA (cancelled) -- juntos expressam confirmed->cancelled e pending->cancelled. Bloqueia o participante promover a propria inscricao pending para confirmed pela API. Admin da org tem policy separada, sem essa restricao. service_role ignora RLS, entao webhooks nao sao afetados.';
