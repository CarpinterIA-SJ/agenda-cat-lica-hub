-- ============================================================
--  022_lock_tally_option_counts.sql
--  Correção de segurança da Fase C.
--
--  O Supabase concede EXECUTE em FUNÇÕES NOVAS a anon/authenticated
--  automaticamente (ALTER DEFAULT PRIVILEGES). Por isso o
--  "revoke from public + grant to service_role" da 021 NÃO bastou:
--  anon ainda conseguia chamar tally_option_counts, que incrementa
--  a contagem SEM enforcement (poderia inflar vagas → forjar
--  "esgotado" / DoS de capacidade).
--
--  tally_option_counts é EXCLUSIVA do backend (webhook/reconcile).
--  reserve_option_counts continua aberta a anon/authenticated de
--  propósito (caminho gratuito reserva direto do cliente).
--
--  ADITIVO: apenas ajuste de grants.
-- ============================================================

revoke execute on function public.tally_option_counts(uuid, jsonb)
  from anon, authenticated, public;

grant execute on function public.tally_option_counts(uuid, jsonb)
  to service_role;
