import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Database,
  OrganizationWithStatus,
  OrganizerStatus,
} from "@/integrations/supabase/types";
import { AdminUserRow } from "@/hooks/use-admin-users";

/** Organização enriquecida para o painel admin: dono, e-mail e contagem de eventos. */
export interface AdminOrganizer extends OrganizationWithStatus {
  owner: { id: string; name: string | null; avatar_url: string | null } | null;
  ownerEmail: string;
  eventCount: number;
}

/**
 * Lista TODAS as organizações com status de aprovação, perfil do dono e a
 * contagem de eventos. Requer que o usuário corrente seja platform admin
 * (RLS de organizations/events em migration 008).
 */
export const useAdminOrganizers = () => {
  return useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(
          "*, owner:profiles!owner_id(id, name, avatar_url), events(count)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      // E-mails vêm da RPC admin (profiles não armazena e-mail). Degrada
      // graciosamente caso a RPC não esteja disponível para o usuário.
      const emailMap: Record<string, string> = {};
      const { data: users, error: usersErr } = await supabase.rpc("get_admin_user_list");
      if (!usersErr && users) {
        (users as AdminUserRow[]).forEach((u) => {
          emailMap[u.user_id] = u.email;
        });
      }

      return ((data ?? []) as any[]).map((o) => ({
        ...o,
        owner: o.owner ?? null,
        ownerEmail: emailMap[o.owner_id] ?? "—",
        eventCount: Array.isArray(o.events) ? o.events[0]?.count ?? 0 : 0,
      })) as AdminOrganizer[];
    },
  });
};

/** Atualiza o status de aprovação de uma organização (aprovar/suspender/rejeitar/reativar). */
export const useUpdateOrganizerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: OrganizerStatus;
      rejection_reason?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const patch: Database["public"]["Tables"]["organizations"]["Update"] = {
        status,
        status_updated_by: user?.id ?? null,
        status_updated_at: new Date().toISOString(),
        rejection_reason: status === "rejected" ? rejection_reason ?? null : null,
      };
      const { data, error } = await supabase
        .from("organizations")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as OrganizationWithStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizers"] });
    },
  });
};
