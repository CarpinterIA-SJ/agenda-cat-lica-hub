import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];

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
        .maybeSingle();
      if (error) throw error;
      return data as Organization | null;
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