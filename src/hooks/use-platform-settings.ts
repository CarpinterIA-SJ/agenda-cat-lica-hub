import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type PlatformSetting = Database["public"]["Tables"]["platform_settings"]["Row"];

/** Lê todas as configurações da plataforma como um mapa key → value. */
export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("platform_settings").select("*");
      if (error) throw error;
      const rows = (data ?? []) as PlatformSetting[];
      const map: Record<string, string> = {};
      rows.forEach((r) => { map[r.key] = r.value; });
      return { rows, map };
    },
  });
};

/** Atualiza (upsert) uma configuração por chave. */
export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("platform_settings")
        .upsert(
          { key, value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        )
        .select()
        .single();
      if (error) throw error;
      return data as PlatformSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
  });
};
