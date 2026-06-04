import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

/** Gera um slug único a partir do nome (sufixo evita colisão na coluna unique). */
export const buildOrgSlug = (name: string, seed?: string) => {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "organizacao";
  const suffix = seed ?? Date.now().toString(36);
  return `${base}-${suffix}`;
};

/**
 * Organização "primária" do usuário (a mais antiga). Usa limit(1) para não
 * quebrar quando o usuário possui mais de uma organização.
 */
export const useMyOrganization = () => {
  return useQuery({
    queryKey: ["organizations", "me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Organization | null;
    },
  });
};

/** Todas as organizações de que o usuário logado é proprietário. */
export const useMyOrganizations = () => {
  return useQuery({
    queryKey: ["organizations", "mine"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Organization[];
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (org: OrganizationInsert) => {
      const { data, error } = await supabase.from("organizations").insert(org).select().single();
      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: OrganizationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
};

export const useEnsureOrganization = () => {
  const { data: org, isLoading } = useMyOrganization();
  const createOrgMutation = useCreateOrganization();

  const ensure = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || org || isLoading) return;

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
    const name = profile?.name || "Minha Organização";
    const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    try {
      await createOrgMutation.mutateAsync({
        name,
        slug,
        owner_id: user.id
      });
    } catch (e) {
      console.error("Erro ao garantir organização", e);
    }
  };

  return {
    ensure,
    isLoading: isLoading || createOrgMutation.isPending
  };
};