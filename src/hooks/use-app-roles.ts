import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/integrations/supabase/types";

const MOCK_KEY = "app_roles_mock";

const readMockRoles = (): AppRole[] => {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AppRole[]) : [];
  } catch {
    return [];
  }
};

/**
 * Roles globais da plataforma (superadmin/admin/support/...).
 *
 * IMPORTANTE: `loading` começa em `true` para evitar race condition em que
 * o consumidor (ex: SuperAdminRoute) avalie isPlatformAdmin antes do fetch
 * iniciar e redirecione prematuramente. Só vai a false após resolver.
 */
export function useAppRoles(userId: string | null | undefined) {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const lastUserId = useRef<string | null | undefined>(undefined);

  const fetchRoles = useCallback(async (): Promise<void> => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let next: AppRole[] = [];
    try {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && Array.isArray(data) && data.length > 0) {
        next = data.map((r: { role: AppRole }) => r.role);
      } else {
        next = readMockRoles();
      }
    } catch {
      next = readMockRoles();
    }

    setRoles(next);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    // Mudou o usuário (ou foi resolvido pela 1ª vez): trava loading=true
    // SÍNCRONO antes de qualquer trabalho assíncrono, fechando a janela
    // de race em que rolesLoading=false + roles=[].
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      if (userId) {
        setLoading(true);
      }
    }
    fetchRoles();
  }, [userId, fetchRoles]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  return {
    roles,
    loading,
    hasRole,
    isSuperAdmin:    roles.includes("superadmin"),
    isPlatformAdmin: roles.includes("superadmin") || roles.includes("admin"),
    refresh: fetchRoles,
  };
}
