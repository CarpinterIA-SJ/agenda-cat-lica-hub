import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type CrmContact = Database["public"]["Tables"]["crm_contacts"]["Row"];
type CrmContactInsert = Database["public"]["Tables"]["crm_contacts"]["Insert"];
type CrmContactUpdate = Database["public"]["Tables"]["crm_contacts"]["Update"];

export const useCrmContacts = (organizationId: string | undefined) => {
  return useQuery({
    queryKey: ["crm-contacts", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CrmContact[];
    },
    enabled: !!organizationId,
  });
};

export const useCreateCrmContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contact: CrmContactInsert) => {
      const { data, error } = await supabase.from("crm_contacts").insert(contact).select().single();
      if (error) throw error;
      return data as CrmContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
    },
  });
};

export const useUpdateCrmContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: CrmContactUpdate & { id: string }) => {
      const { data, error } = await supabase.from("crm_contacts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as CrmContact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
    },
  });
};

export const useDeleteCrmContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-contacts"] });
    },
  });
};
