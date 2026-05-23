import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "@/integrations/supabase/profiles";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "./use-auth";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";

  const query = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (updates: TablesUpdate<"profiles">) => updateProfile(userId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", userId], updated);
    },
  });

  return {
    profile:       query.data ?? null,
    isLoading:     query.isLoading,
    error:         query.error,
    updateProfile: mutation.mutateAsync,
    isUpdating:    mutation.isPending,
  };
}
