import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Payment, PaymentMethod, PaymentStatus } from "@/integrations/supabase/types";

// ============================================================
//  Dados financeiros do painel admin.
//
//  Fonte de valor REAL = tabela `payments` (amount_cents / fee_cents
//  / net_cents / method / status / paid_at). `event_registrations`
//  NÃO tem campo de valor. Leitura cross-org liberada ao platform
//  admin via migration 014.
// ============================================================

export interface EnrichedPayment extends Payment {
  eventName: string;
  eventStatus: string | null;
  organizationName: string;
  participantName: string;
}

export interface FinancialTicket {
  event_id: string;
  name: string;
  type: string;
  price_cents: number;
  quantity: number;
  sold: number;
}

export interface FinancialEvent {
  id: string;
  name: string;
  organization_id: string;
  status: string;
  start_at: string | null;
}

export interface FinancialOrg {
  id: string;
  name: string;
}

export interface AdminFinancialData {
  payments: EnrichedPayment[];
  tickets: FinancialTicket[];
  events: FinancialEvent[];
  organizations: FinancialOrg[];
}

/**
 * Carrega tudo que o dashboard financeiro precisa em uma única query
 * (payments + tickets + events + organizations). Refetch a cada 60s —
 * mesmo padrão da AdminModerationPage (o projeto não usa realtime).
 */
export const useAdminFinancialData = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin-financial"],
    enabled: options?.enabled ?? true,
    refetchInterval: 60_000,
    queryFn: async (): Promise<AdminFinancialData> => {
      const [paymentsRes, ticketsRes, eventsRes, orgsRes] = await Promise.all([
        supabase
          .from("payments")
          .select(
            "*, event:events(name, status, organization_id, start_at), organization:organizations(name), registration:event_registrations(full_name)",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("event_tickets")
          .select("event_id, name, type, price_cents, quantity, sold"),
        supabase.from("events").select("id, name, organization_id, status, start_at"),
        supabase.from("organizations").select("id, name"),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (ticketsRes.error) throw ticketsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (orgsRes.error) throw orgsRes.error;

      const payments: EnrichedPayment[] = ((paymentsRes.data ?? []) as any[]).map((p) => ({
        ...p,
        eventName: p.event?.name ?? "—",
        eventStatus: p.event?.status ?? null,
        organizationName: p.organization?.name ?? "—",
        participantName: p.registration?.full_name ?? "—",
      }));

      return {
        payments,
        tickets: (ticketsRes.data ?? []) as FinancialTicket[],
        events: (eventsRes.data ?? []) as FinancialEvent[],
        organizations: (orgsRes.data ?? []) as FinancialOrg[],
      };
    },
  });
};

// ─── Rótulos / cores compartilhados ─────────────────────────

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  credit_card: "Cartão",
  pix: "PIX",
  boleto: "Boleto",
  free: "Gratuito",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendente",
  paid: "Confirmado",
  refunded: "Estornado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  refunded: "bg-red-100 text-red-800 hover:bg-red-100",
  failed: "bg-red-100 text-red-800 hover:bg-red-100",
  cancelled: "bg-slate-200 text-slate-700 hover:bg-slate-200",
};
