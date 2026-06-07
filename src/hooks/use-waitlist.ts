import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventWaitlist, EventWaitlistRow } from "@/integrations/supabase/types";
import { useCreateAuditLog } from "@/hooks/use-audit-log";

// ============================================================
//  Fila de espera (waitlist). Padrão options?: { enabled? }.
//  Posições e notificação são feitas por RPCs (migration 015)
//  para garantir atomicidade.
// ============================================================

type EventRow = {
  id: string;
  name: string;
  slug: string | null;
  start_at: string | null;
  status: string;
  location: unknown;
};

export interface MyWaitlistItem extends EventWaitlist {
  event: EventRow | null;
}

/** Fila completa de um evento (organizador/admin) — nome + e-mail via RPC. */
export const useEventWaitlist = (eventId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["event-waitlist", eventId],
    enabled: (options?.enabled ?? true) && !!eventId,
    queryFn: async (): Promise<EventWaitlistRow[]> => {
      const { data, error } = await supabase.rpc("get_event_waitlist", { p_event_id: eventId! });
      if (error) throw error;
      return (data ?? []) as EventWaitlistRow[];
    },
  });
};

/** Entrada do usuário logado neste evento (null se não está na fila). */
export const useMyWaitlistEntry = (eventId: string | undefined, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["my-waitlist-entry", eventId],
    enabled: (options?.enabled ?? true) && !!eventId,
    queryFn: async (): Promise<EventWaitlist | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("event_waitlist")
        .select("*")
        .eq("event_id", eventId!)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as EventWaitlist | null;
    },
  });
};

/** Todos os eventos em que o usuário logado está na fila. */
export const useMyWaitlist = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["my-waitlist"],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<MyWaitlistItem[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("event_waitlist")
        .select("*, event:events(id, name, slug, start_at, status, location)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MyWaitlistItem[];
    },
  });
};

/** Entrar na fila (RPC calcula a posição; erra se já inscrito ou já na fila). */
export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ticketTypeId }: { eventId: string; ticketTypeId?: string | null }) => {
      const { data, error } = await supabase.rpc("waitlist_join", {
        p_event_id: eventId,
        p_ticket_type_id: ticketTypeId ?? null,
      });
      if (error) throw error;
      return data as EventWaitlist;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["my-waitlist-entry", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["event-waitlist", vars.eventId] });
    },
  });
};

/** Sair da fila (RPC recalcula as posições dos demais). */
export const useLeaveWaitlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; eventId?: string }) => {
      const { error } = await supabase.rpc("waitlist_leave", { p_id: id });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["my-waitlist-entry", vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-waitlist", vars.eventId] });
    },
  });
};

/** Notificar o próximo da fila (organizador/admin) + log em audit_logs. */
export const useNotifyWaitlist = (eventId: string | undefined) => {
  const queryClient = useQueryClient();
  const createAuditLog = useCreateAuditLog();
  return useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error("Evento inválido");
      const { data, error } = await supabase.rpc("waitlist_notify_next", { p_event_id: eventId });
      if (error) throw error;
      return data as EventWaitlist;
    },
    onSuccess: (row) => {
      createAuditLog.mutate({
        action: "NOTIFICAR_FILA",
        entity_type: "event_waitlist",
        entity_id: row?.id ?? null,
        details: {
          event_id: eventId,
          user_id: row?.user_id ?? null,
          position: row?.position ?? null,
          expires_at: row?.expires_at ?? null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["event-waitlist", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
    },
  });
};
