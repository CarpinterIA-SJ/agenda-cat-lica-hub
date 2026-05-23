import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "@/integrations/supabase/projects";
import type { ProjectStatus, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ─── Lista de projetos de uma organização ────────────────────────────────────

export function useProjects(organizationId: string, status?: ProjectStatus) {
  const queryClient = useQueryClient();
  const key = ["projects", organizationId, status ?? "all"];

  const query = useQuery({
    queryKey: key,
    queryFn:  () => listProjects(organizationId, status),
    enabled:  !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: TablesInsert<"projects">) => createProject(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", organizationId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<"projects"> }) =>
      updateProject(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", organizationId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects", organizationId] }),
  });

  return {
    projects:      query.data ?? [],
    isLoading:     query.isLoading,
    error:         query.error,
    createProject: createMutation.mutateAsync,
    updateProject: (id: string, updates: TablesUpdate<"projects">) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteProject: deleteMutation.mutateAsync,
    isCreating:    createMutation.isPending,
    isDeleting:    deleteMutation.isPending,
  };
}

// ─── Projeto individual ───────────────────────────────────────────────────────

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn:  () => getProject(id),
    enabled:  !!id,
  });
}
