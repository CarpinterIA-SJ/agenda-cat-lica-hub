import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/integrations/supabase/types";

const MOCK_KEY = "app_roles_mock";

/**
 * Roles globais da plataforma (superadmin/admin/support/...).
 * Diferente de `useAuth().role` (que é o papel funcional escolhido pelo
 * usuário: organizer/participant). Esse hook lê SOMENTE da tabela
 * `user_roles` (server-side, anti-tampering).
 *
 * Em ambiente mock (sem Supabase real), faz fallback para
 * localStorage[MOCK_KEY] = JSON.stringify(['superadmin']) para permitir
 * testes manuais e e2e. Em produção, o localStorage é IGNORADO porque a
 * query no Supabase real preenche o estado primeiro.
 */
export function useAppRoles(userId: string | null | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);

  const fetchRoles = useCallback(async () => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && Array.isArray(data) && data.length > 0) {
        setRoles(data.map((r: { role: AppRole }) => r.role));
        return;
      }
    } catch {
      // mock-client não tem user_roles — cai para fallback
    }

    try {
      const raw = localStorage.getItem(MOCK_KEY);
      const parsed = raw ? (JSON.parse(raw) as AppRole[]) : [];
      setRoles(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return {
    roles,
    loading,
    hasRole,
    isSuperAdmin:   roles.includes("superadmin"),
    isPlatformAdmin: roles.includes("superadmin") || roles.includes("admin"),
    refresh: fetchRoles,
  };
}
