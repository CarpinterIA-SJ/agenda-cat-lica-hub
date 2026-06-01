import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  WithdrawalRequest,
  WithdrawalStatus,
} from "@/integrations/supabase/types";

/** Solicitação de repasse com o nome da organização (para o painel admin). */
export interface WithdrawalRequestWithOrg extends WithdrawalRequest {
  organization: { id: string; name: string } | null;
}

interface WithdrawalFilters {
  status?: WithdrawalStatus;
  organization_id?: string;
}

/**
 * Lista solicitações de repasse (admin enxerga todas via RLS; organizador vê
 * apenas as da própria org). Aceita filtros opcionais por status e org.
 */
export const useWithdrawalRequests = (filters?: WithdrawalFilters) => {
  return useQuery({
    queryKey: ["withdrawal-requests", filters ?? {}],
    queryFn: async () => {
      let query = supabase
        .from("withdrawal_requests")
        .select("*, organization:organizations!organization_id(id, name)")
        .order("created_at", { ascending: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as WithdrawalRequestWithOrg[];
    },
  });
};

/** Solicitações de repasse da organização do usuário logado. */
export const useMyWithdrawalRequests = () => {
  return useQuery({
    queryKey: ["withdrawal-requests", "me"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!org) return [];

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WithdrawalRequest[];
    },
  });
};

/** Cria uma solicitação de repasse (dados bancários + valor em centavos). */
export const useCreateWithdrawalRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      organization_id: string;
      amount_cents: number;
      bank_name?: string | null;
      bank_agency?: string | null;
      bank_account?: string | null;
      bank_holder?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert({ ...payload, requested_by: user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as WithdrawalRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
    },
  });
};

/** Admin: aprova, rejeita ou marca como pago um repasse. */
export const useUpdateWithdrawalStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: WithdrawalStatus;
      admin_notes?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const patch: Database["public"]["Tables"]["withdrawal_requests"]["Update"] = {
        status,
        reviewed_by: user?.id ?? null,
        reviewed_at: now,
      };
      if (status === "paid") patch.paid_at = now;
      if (admin_notes !== undefined) patch.admin_notes = admin_notes;

      const { data, error } = await supabase
        .from("withdrawal_requests")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as WithdrawalRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawal-requests"] });
    },
  });
};
