import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database, EventStatus } from "@/integrations/supabase/types";

// ============================================================
//  Moderação de eventos (painel admin).
//
//  O enum event_status do banco é ('draft','active','paused',
//  'archived'). Os estados de moderação são derivados dele
//  (+ rejection_reason) — sem alterar o enum:
//    draft                      -> pendente   (aguardando revisão)
//    active                     -> aprovado
//    paused                     -> suspenso
//    archived + rejection_reason-> rejeitado
//    archived (sem motivo)      -> finalizado
// ============================================================

export type ModerationState =
  | "pendente"
  | "aprovado"
  | "suspenso"
  | "rejeitado"
  | "finalizado";

export const toModerationState = (
  status: EventStatus,
  rejectionReason: string | null,
): ModerationState => {
  if (status === "active") return "aprovado";
  if (status === "paused") return "suspenso";
  if (status === "draft") return "pendente";
  return rejectionReason ? "rejeitado" : "finalizado"; // archived
};

export interface ModerationTicket {
  name: string;
  type: string;
  price_cents: number;
  quantity: number;
}

export interface ModerationEvent {
  id: string;
  slug: string;
  name: string;
  organizationId: string;
  organizationName: string;
  category: string | null;
  format: string;
  status: EventStatus;
  state: ModerationState;
  rejectionReason: string | null;
  startAt: string | null; // data do evento
  createdAt: string; // data de submissão
  updatedAt: string;
  submittedDaysAgo: number;
  capacity: number; // soma das quantidades dos ingressos
  avgPriceCents: number | null; // preço médio dos ingressos
  description: string | null;
  descriptionText: string | null;
  bannerUrl: string | null;
  location: unknown;
  tickets: ModerationTicket[];
}

const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

/**
 * Lista TODOS os eventos para moderação (admin lê todos via RLS — 008/013),
 * ordenados por data de submissão (mais antigos primeiro = fila justa).
 * Refetch a cada 60s (o projeto não usa Supabase realtime).
 */
export const useAdminModerationEvents = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin-moderation-events"],
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<ModerationEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select(
          "*, organization:organizations!organization_id(id, name), tickets:event_tickets(name, type, price_cents, quantity)",
        )
        .order("created_at", { ascending: true });
      if (error) throw error;

      return ((data ?? []) as any[]).map((e) => {
        const tickets: ModerationTicket[] = Array.isArray(e.tickets) ? e.tickets : [];
        const capacity = tickets.reduce((sum, t) => sum + (t.quantity ?? 0), 0);
        const avgPriceCents = tickets.length
          ? Math.round(
              tickets.reduce((sum, t) => sum + (t.price_cents ?? 0), 0) / tickets.length,
            )
          : null;
        return {
          id: e.id,
          slug: e.slug,
          name: e.name,
          organizationId: e.organization_id,
          organizationName: e.organization?.name ?? "—",
          category: e.category,
          format: e.format,
          status: e.status,
          state: toModerationState(e.status, e.rejection_reason ?? null),
          rejectionReason: e.rejection_reason ?? null,
          startAt: e.start_at,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
          submittedDaysAgo: daysSince(e.created_at),
          capacity,
          avgPriceCents,
          description: e.description,
          descriptionText: e.description_text,
          bannerUrl: e.banner_url,
          location: e.location,
          tickets,
        };
      });
    },
  });
};

export interface ModerateEventInput {
  id: string;
  status: EventStatus;
  /** Persistido apenas ao rejeitar; limpo nos demais estados. */
  rejection_reason?: string | null;
}

/** Atualiza status (+ motivo) de um evento. Requer platform admin (RLS 013). */
export const useModerateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: ModerateEventInput) => {
      const patch: Database["public"]["Tables"]["events"]["Update"] = {
        status,
        rejection_reason: rejection_reason ?? null,
      };
      const { data, error } = await supabase
        .from("events")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-moderation-stats"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export interface ModerationStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  avgApprovalHours: number | null;
}

/**
 * Resumo do topo da página. "tempo médio de aprovação" é calculado a partir
 * dos logs APROVAR_EVENTO (details.submitted_at vs created_at do log).
 */
export const useModerationStats = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin-moderation-stats"],
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<ModerationStats> => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const iso = todayStart.toISOString();

      const [pendingRes, approvedRes, rejectedRes, approveLogsRes] = await Promise.all([
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "draft"),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("action", "APROVAR_EVENTO")
          .gte("created_at", iso),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("action", "REJEITAR_EVENTO")
          .gte("created_at", iso),
        supabase
          .from("audit_logs")
          .select("created_at, details")
          .eq("action", "APROVAR_EVENTO")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      const logs = (approveLogsRes.data ?? []) as { created_at: string; details: any }[];
      const diffs = logs
        .map((l) => {
          const submitted = l.details?.submitted_at;
          if (!submitted) return null;
          const ms = new Date(l.created_at).getTime() - new Date(submitted).getTime();
          return ms >= 0 ? ms / 3_600_000 : null;
        })
        .filter((v): v is number => v !== null);
      const avgApprovalHours = diffs.length
        ? Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10
        : null;

      return {
        pending: pendingRes.count ?? 0,
        approvedToday: approvedRes.count ?? 0,
        rejectedToday: rejectedRes.count ?? 0,
        avgApprovalHours,
      };
    },
  });
};
