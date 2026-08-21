-- ============================================================
--  041_ROLLBACK.sql
--  Desfaz 041_lock_down_rpc_grants.sql. NÃO APLICAR a menos que algo
--  quebre em produção após o push da 041. Não é migration numerada de
--  propósito — não faz parte da sequência normal, só existe para
--  reversão manual e pontual.
--
--  Restaura exatamente os grants que a 041 removeu:
--    Bloco A (10 funções): devolve anon + authenticated.
--    Bloco B (7 funções):  devolve anon (authenticated nunca saiu).
--    validate_coupon:      FORA daqui de propósito — a 041 só revogou
--                           de public nela, anon/authenticated nunca
--                           saíram, nada a restaurar.
-- ============================================================


-- ============================================================
--  BLOCO A — restaura anon + authenticated
-- ============================================================

grant execute on function public.reserve_ticket_sold(
  uuid, uuid, uuid, integer, timestamptz, boolean, jsonb
) to anon, authenticated;

grant execute on function public.confirm_ticket_reservation(uuid)
  to anon, authenticated;

grant execute on function public.release_ticket_reservation(uuid)
  to anon, authenticated;

grant execute on function public.release_ticket_hold(uuid, uuid)
  to anon, authenticated;

grant execute on function public.increment_ticket_sold(uuid, integer)
  to anon, authenticated;

grant execute on function public.decrement_ticket_sold(uuid, integer)
  to anon, authenticated;

grant execute on function public.reserve_option_counts(uuid, jsonb)
  to anon, authenticated;

grant execute on function public.release_option_counts(uuid, jsonb)
  to anon, authenticated;

grant execute on function public.consume_coupon(uuid, text)
  to anon, authenticated;

grant execute on function public.release_coupon_use(uuid)
  to anon, authenticated;


-- ============================================================
--  BLOCO B — restaura anon (authenticated já mantido pela 041)
-- ============================================================

grant execute on function public.create_free_registration(
  uuid, uuid, text, text, text, text, date, jsonb, jsonb, text
) to anon;

grant execute on function public.get_event_organizer_contact(uuid)
  to anon;

grant execute on function public.get_event_waitlist(uuid)
  to anon;

grant execute on function public.get_admin_user_list()
  to anon;

grant execute on function public.waitlist_join(uuid, uuid)
  to anon;

grant execute on function public.waitlist_leave(uuid)
  to anon;

grant execute on function public.waitlist_notify_next(uuid)
  to anon;
