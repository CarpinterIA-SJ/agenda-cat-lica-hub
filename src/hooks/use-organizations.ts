import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from "@/integrations/supabase/organizations";
import type { OrgMemberRole, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "./use-auth";

// ─── Organizações ─────────────────────────────────────────────────────────────

export function useOrganizations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn:  listOrganizations,
    enabled:  !!user,
  });

  const createMutation = useMutation({
    mutationFn: (payload: TablesInsert<"organizations">) => createOrganization(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<"organizations"> }) =>
      updateOrganization(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organizations"] }),
  });

  return {
    organizations:      query.data ?? [],
    isLoading:          query.isLoading,
    error:              query.error,
    createOrganization: createMutation.mutateAsync,
    updateOrganization: (id: string, updates: TablesUpdate<"organizations">) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteOrganization: deleteMutation.mutateAsync,
    isCreating:         createMutation.isPending,
    isDeleting:         deleteMutation.isPending,
  };
}

// ─── Organização individual ───────────────────────────────────────────────────

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["organizations", id],
    queryFn:  () => getOrganization(id),
    enabled:  !!id,
  });
}

// ─── Membros ──────────────────────────────────────────────────────────────────

export function useOrganizationMembers(organizationId: string) {
  const queryClient = useQueryClient();
  const key = ["organization_members", organizationId];

  const query = useQuery({
    queryKey: key,
    queryFn:  () => listMembers(organizationId),
    enabled:  !!organizationId,
  });

  const addMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role?: OrgMemberRole }) =>
      addMember(organizationId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: OrgMemberRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    members:          query.data ?? [],
    isLoading:        query.isLoading,
    error:            query.error,
    addMember:        addMutation.mutateAsync,
    updateMemberRole: (memberId: string, role: OrgMemberRole) =>
      updateRoleMutation.mutateAsync({ memberId, role }),
    removeMember:     removeMutation.mutateAsync,
    isAdding:         addMutation.isPending,
    isRemoving:       removeMutation.isPending,
  };
}
