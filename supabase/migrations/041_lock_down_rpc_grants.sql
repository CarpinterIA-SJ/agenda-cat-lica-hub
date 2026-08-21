-- ============================================================
--  041_lock_down_rpc_grants.sql
--  FASE 5 / SEGURANÇA — fecha o GRANT EXECUTE de 18 funções
--  security definer que anon (e, em 10 delas, também authenticated)
--  não deveriam poder chamar.
--
--  CAUSA RAIZ (documentada em 022_lock_tally_option_counts.sql:5-10,
--  repetida aqui porque é a razão de existir desta migration):
--  o Supabase concede EXECUTE em FUNÇÕES NOVAS a anon/authenticated
--  automaticamente via ALTER DEFAULT PRIVILEGES no momento do CREATE
--  FUNCTION. `revoke all on function ... from public` — o padrão usado
--  em quase todas as migrations deste projeto (018, 025, 031, 033, 034,
--  036, 039) — NÃO remove esses grants: eles não vêm de PUBLIC, vêm de
--  concessão direta a anon e a authenticated. Só 022 e 026 (linha
--  purge_rate_limits) fizeram o revoke correto até hoje. Esta migration
--  generaliza esse padrão. A auditoria de pg_proc.proacl encontrou 33
--  funções security definer com EXECUTE para anon/authenticated; 15
--  delas (balde C) ficam INTOCADAS de propósito (ver bloco final) —
--  as 18 restantes são fechadas aqui.
--
--  PRIORIDADE MÁXIMA: increment_ticket_sold e decrement_ticket_sold
--  (bloco A) aceitam p_ticket_id/p_quantity de QUALQUER chamador anon
--  ou authenticated, sem checagem nenhuma no corpo — hoje um único
--  request forjado (`supabase.rpc('increment_ticket_sold', {p_ticket_id,
--  p_quantity: 999999})`) esgota ou infla `sold` de um evento pago
--  inteiro. É a exposição mais grave dos 33 achados.
--
--  TRÊS BLOCOS:
--    A — só service_role (revoke public+anon+authenticated)
--    B — authenticated (revoke public+anon; a função já valida
--        autorização no próprio corpo — grant não substitui checagem,
--        só reduz superfície)
--    C — NÃO TOCADO. Ver bloco de comentário no fim: funções chamadas
--        DENTRO de policies de RLS ou gatilhos internos. Revogar
--        authenticated nelas derruba toda query sob RLS (permission
--        denied) ou quebra criação de conta/organização.
--
--  Todo revoke é por ASSINATURA COMPLETA (nunca `from public` sozinho),
--  espelhando o padrão correto já usado em 022 e 026.
-- ============================================================


-- ============================================================
--  BLOCO A — SOMENTE service_role
--  11 funções pedidas, 10 entram aqui. waitlist_notify_next foi
--  RECLASSIFICADA para o bloco B (grant authenticated, não
--  service_role) — chamada direta do cliente, ver nota lá. Nenhuma
--  outra função deste bloco tem chamada direta do cliente (grep em
--  src/ e supabase/functions/ confirmado por função, ver relatório).
-- ============================================================

-- reserve_ticket_sold(uuid,uuid,uuid,integer,timestamptz,boolean,jsonb)
-- assinatura real (039): p_registration_id, p_event_id, p_ticket_id,
-- p_quantity, p_expires_at, p_options_reserved, p_selections
revoke execute on function public.reserve_ticket_sold(
  uuid, uuid, uuid, integer, timestamptz, boolean, jsonb
) from public, anon, authenticated;
grant execute on function public.reserve_ticket_sold(
  uuid, uuid, uuid, integer, timestamptz, boolean, jsonb
) to service_role;

-- confirm_ticket_reservation(uuid) — retorno text desde a 039, assinatura de parâmetros inalterada.
revoke execute on function public.confirm_ticket_reservation(uuid)
  from public, anon, authenticated;
grant execute on function public.confirm_ticket_reservation(uuid)
  to service_role;

-- release_ticket_reservation(uuid)
revoke execute on function public.release_ticket_reservation(uuid)
  from public, anon, authenticated;
grant execute on function public.release_ticket_reservation(uuid)
  to service_role;

-- release_ticket_hold(uuid, uuid) — helper interno dos gatilhos do bloco C
-- (release_ticket_on_registration_cancel/delete). A 034 nunca concedeu
-- execute a NINGUÉM, nem service_role: os únicos chamadores são os dois
-- gatilhos, que rodam como o dono da função (security definer), não como
-- o papel da sessão. O grant a service_role abaixo é defensivo (mesmo
-- padrão das demais desta migration), não requisito de funcionamento.
revoke execute on function public.release_ticket_hold(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.release_ticket_hold(uuid, uuid)
  to service_role;

-- increment_ticket_sold(uuid, integer) — PRIORIDADE MÁXIMA, ver cabeçalho.
revoke execute on function public.increment_ticket_sold(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.increment_ticket_sold(uuid, integer)
  to service_role;

-- decrement_ticket_sold(uuid, integer) — PRIORIDADE MÁXIMA, ver cabeçalho.
revoke execute on function public.decrement_ticket_sold(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.decrement_ticket_sold(uuid, integer)
  to service_role;

-- reserve_option_counts(uuid, jsonb) — REVERTE decisão de 021/022
-- ("continua aberta a anon/authenticated de propósito, caminho gratuito
-- reserva direto do cliente"). Essa premissa morreu na 034/039: o
-- caminho gratuito hoje chama create_free_registration, que executa
-- `perform public.reserve_option_counts(...)` POR DENTRO da própria
-- transação, como o dono da função (security definer) — não precisa de
-- grant a anon/authenticated para isso continuar funcionando. Grep em
-- src/ confirma ZERO `.rpc("reserve_option_counts")` restante no
-- cliente (o único vestígio é comentário histórico em
-- EventRegistrationModal.tsx:289 dizendo "antes"). Fechar aqui é
-- puramente reduzir superfície: hoje nada quebra.
revoke execute on function public.reserve_option_counts(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.reserve_option_counts(uuid, jsonb)
  to service_role;

-- release_option_counts(uuid, jsonb)
revoke execute on function public.release_option_counts(uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.release_option_counts(uuid, jsonb)
  to service_role;

-- consume_coupon(uuid, text) — a 033 já pretendia isto ("consume/release
-- ficam FORA do alcance do cliente"), mas só revogou de public. Fechando
-- o buraco real agora.
revoke execute on function public.consume_coupon(uuid, text)
  from public, anon, authenticated;
grant execute on function public.consume_coupon(uuid, text)
  to service_role;

-- release_coupon_use(uuid) — mesma lacuna da 033 que consume_coupon.
revoke execute on function public.release_coupon_use(uuid)
  from public, anon, authenticated;
grant execute on function public.release_coupon_use(uuid)
  to service_role;


-- ============================================================
--  BLOCO B — authenticated (revoke public + anon)
--  Cada função abaixo foi lida por inteiro (CREATE FUNCTION na
--  migration de origem) e valida autorização no próprio corpo antes de
--  fazer qualquer coisa. O grant aqui só reduz superfície de ataque
--  (anon fora); não é ele quem impede acesso indevido — o corpo da
--  função impede.
-- ============================================================

-- create_free_registration(uuid,uuid,text,text,text,text,date,jsonb,jsonb,text)
-- Valida: auth.uid() is null -> AUTH_REQUIRED (039:315-317).
revoke execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text
) from public, anon;
grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text
) to authenticated;

-- get_event_organizer_contact(uuid)
-- Valida: exists(event_registrations onde user_id = auth.uid()) (036:42-47).
revoke execute on function public.get_event_organizer_contact(uuid)
  from public, anon;
grant execute on function public.get_event_organizer_contact(uuid)
  to authenticated;

-- get_event_waitlist(uuid)
-- Valida: is_event_org_admin(p_event_id) or is_platform_admin() (015:191).
revoke execute on function public.get_event_waitlist(uuid)
  from public, anon;
grant execute on function public.get_event_waitlist(uuid)
  to authenticated;

-- get_admin_user_list() — sem parâmetros.
-- Valida: is_platform_admin(), senão raise 42501 (005:27-30). Esta é uma
-- das que NUNCA teve "revoke ... from public" na migration de origem —
-- forte candidata a uma das 13 com PUBLIC ainda aberto na auditoria.
revoke execute on function public.get_admin_user_list()
  from public, anon;
grant execute on function public.get_admin_user_list()
  to authenticated;

-- waitlist_join(uuid, uuid)
-- Valida: auth.uid() is null -> raise (015:68-70).
revoke execute on function public.waitlist_join(uuid, uuid)
  from public, anon;
grant execute on function public.waitlist_join(uuid, uuid)
  to authenticated;

-- waitlist_leave(uuid)
-- Valida: v_owner <> auth.uid() and not is_platform_admin() -> raise (015:119-121).
revoke execute on function public.waitlist_leave(uuid)
  from public, anon;
grant execute on function public.waitlist_leave(uuid)
  to authenticated;

-- waitlist_notify_next(uuid) — RECLASSIFICADA do bloco A para o bloco B.
-- O pedido original colocava esta função no bloco A (só service_role).
-- Grep em src/hooks/use-waitlist.ts:120 mostra que o painel do
-- organizador CHAMA esta RPC diretamente do cliente
-- (`supabase.rpc("waitlist_notify_next", ...)`, botão "notificar
-- próximo da fila") — revogar authenticated quebraria essa função para
-- todo organizador em produção. A função (015:133-167) VALIDA
-- autorização no próprio corpo: `if not (is_event_org_admin(p_event_id)
-- or is_platform_admin()) then raise`. Grant original da 015 já era
-- authenticated sem anon explícito — é o padrão do bloco B; só entrou
-- na lista pedida por engano de classificação. Aprovado para entrar
-- aqui nesta revisão.
revoke execute on function public.waitlist_notify_next(uuid)
  from public, anon;
grant execute on function public.waitlist_notify_next(uuid)
  to authenticated;

-- validate_coupon(uuid, text) — EXCEÇÃO DELIBERADA, NÃO "CORRIGIR" ISTO.
-- O front chama esta RPC (EventRegistrationModal.tsx:143) ANTES do login
-- obrigatório do formulário (o gate de auth.uid() só existe no submit,
-- 277-285) — hoje ela é usada por visitante anônimo conferindo um cupom
-- antes de entrar na conta. Revogar anon aqui QUEBRA essa conferência
-- pré-login (o campo de cupom fica inutilizável para quem ainda não
-- logou). A função é `stable`/somente leitura e não consome uso (quem
-- consome é consume_coupon, já fechada no bloco A) — expor o resultado
-- de validade/desconto a anon não abre uma corrida nem uma forma de
-- esgotar a campanha. Por isso NÃO revogamos anon aqui, fugindo do
-- padrão do bloco B por decisão deliberada e aprovada nesta revisão.
-- Se um audit futuro reabrir este item: o buraco real já foi fechado
-- (consume_coupon é service_role-only); isto aqui é read-only por
-- design. Só reafirmamos o revoke de public, que a 033 já fazia.
revoke execute on function public.validate_coupon(uuid, text)
  from public;
-- anon e authenticated mantidos como já estavam (033:97). Nenhuma mudança de grant.


-- ============================================================
--  BLOCO C — NÃO TOCADO NESTA MIGRATION (nenhum SQL abaixo é executado;
--  bloco existe só para registro/auditoria de que foram considerados e
--  excluídos de propósito).
--
--  has_role, is_event_org_admin, is_platform_admin, is_superadmin,
--  shares_organization_with, user_admin_org_ids, user_org_ids,
--  is_org_approved, enforce_audit_log_actor, enforce_org_approved_publish,
--  handle_new_organization, handle_new_user, user_roles_block_self_grant,
--  release_ticket_on_registration_cancel, release_ticket_on_registration_delete
--
--  Confirmado por leitura de origem (não por query em pg_policies — sem
--  acesso a banco vivo nesta tarefa; ver relatório sobre a lacuna):
--
--  Usadas dentro de `using`/`with check` de RLS (confirmado por grep nas
--  migrations 001, 003, 006, 007, 008, 012, 013, 014, 015, 019+ em
--  diante): is_platform_admin, is_event_org_admin, user_org_ids,
--  user_admin_org_ids, shares_organization_with (026:123, policy de
--  profiles). Revogar authenticated nelas faz TODA query sob RLS que
--  toca essas tabelas falhar com permission denied — não é exagero do
--  pedido original, é literal.
--
--  is_org_approved: chamada só dentro de enforce_org_approved_publish
--  (trigger security definer, 023:43) — não precisaria de grant a
--  ninguém para o gatilho funcionar, mas a 023 já concede
--  anon/authenticated/service_role de propósito; não mexido, por
--  instrução.
--
--  has_role, is_superadmin: NÃO encontradas em nenhuma policy nem em
--  nenhuma chamada de código (grep em src/ só acha os dois nomes dentro
--  de types.ts gerado, nunca um `.rpc(...)` real) — aparentam estar sem
--  uso hoje. Mesmo assim, NÃO tocadas: são as duas exceções à
--  justificativa "usadas em RLS" dada no pedido, e vão para o relatório
--  como observação, não como mudança.
--
--  enforce_audit_log_actor, handle_new_organization, handle_new_user,
--  user_roles_block_self_grant, release_ticket_on_registration_cancel,
--  release_ticket_on_registration_delete: funções de gatilho puras
--  (`execute procedure`/`execute function` em CREATE TRIGGER) — nunca
--  chamadas via RPC, nunca concedidas a papel nenhum nas migrations de
--  origem. handle_new_user é o gatilho de criação de conta
--  (on_auth_user_created, 001:216-218).
-- ============================================================
