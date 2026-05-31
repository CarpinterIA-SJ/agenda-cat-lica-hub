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

// ─── Recursos org-scoped (tags, grupos, setores, categorias) ────────────────
// Mesma forma de CRUD: lista por organization_id e invalida a própria chave.

type OrgScopedTable = "crm_tags" | "crm_groups" | "crm_sectors" | "crm_categories";

const makeOrgScopedHooks = <T extends OrgScopedTable>(table: T, key: string) => {
  type Row = Database["public"]["Tables"][T]["Row"];
  type Insert = Database["public"]["Tables"][T]["Insert"];
  type Update = Database["public"]["Tables"][T]["Update"];

  const useList = (organizationId: string | undefined) =>
    useQuery({
      queryKey: [key, organizationId],
      queryFn: async () => {
        if (!organizationId) return [] as Row[];
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Row[];
      },
      enabled: !!organizationId,
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (payload: Insert) => {
        const { data, error } = await supabase.from(table).insert(payload as any).select().single();
        if (error) throw error;
        return data as Row;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, ...updates }: Update & { id: string }) => {
        const { data, error } = await supabase.from(table).update(updates as any).eq("id", id).select().single();
        if (error) throw error;
        return data as Row;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  };

  return { useList, useCreate, useUpdate, useDelete };
};

const tagHooks = makeOrgScopedHooks("crm_tags", "crm-tags");
export const useCrmTags = tagHooks.useList;
export const useCreateCrmTag = tagHooks.useCreate;
export const useUpdateCrmTag = tagHooks.useUpdate;
export const useDeleteCrmTag = tagHooks.useDelete;

const groupHooks = makeOrgScopedHooks("crm_groups", "crm-groups");
export const useCrmGroups = groupHooks.useList;
export const useCreateCrmGroup = groupHooks.useCreate;
export const useUpdateCrmGroup = groupHooks.useUpdate;
export const useDeleteCrmGroup = groupHooks.useDelete;

const sectorHooks = makeOrgScopedHooks("crm_sectors", "crm-sectors");
export const useCrmSectors = sectorHooks.useList;
export const useCreateCrmSector = sectorHooks.useCreate;
export const useUpdateCrmSector = sectorHooks.useUpdate;
export const useDeleteCrmSector = sectorHooks.useDelete;

const categoryHooks = makeOrgScopedHooks("crm_categories", "crm-categories");
export const useCrmCategories = categoryHooks.useList;
export const useCreateCrmCategory = categoryHooks.useCreate;
export const useUpdateCrmCategory = categoryHooks.useUpdate;
export const useDeleteCrmCategory = categoryHooks.useDelete;
