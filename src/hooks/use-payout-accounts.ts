import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PayoutAccount = Database["public"]["Tables"]["organization_payout_accounts"]["Row"];
type PayoutAccountInsert = Database["public"]["Tables"]["organization_payout_accounts"]["Insert"];

/** Contas de repasse de uma organização. RLS restringe ao owner/admin da própria org. */
export const usePayoutAccounts = (orgId: string | undefined) => {
  return useQuery({
    queryKey: ["payout-accounts", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_payout_accounts")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PayoutAccount[];
    },
    enabled: !!orgId,
  });
};

export const useCreatePayoutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: PayoutAccountInsert) => {
      const { data, error } = await supabase
        .from("organization_payout_accounts")
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data as PayoutAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
    },
  });
};

export const useDeletePayoutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organization_payout_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-accounts"] });
    },
  });
};
