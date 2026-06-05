import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLog } from "@/integrations/supabase/types";

export type AuditAcao =
  | "Aprovado"
  | "Rejeitado"
  | "Suspenso"
  | "Reativado"
  | "Pago"
  | "Destacado"
  | "Removido"
  | string;

export type AuditTipo = "organizador" | "repasse" | "evento" | "outro";

export interface AuditLogEntry {
  id: string;
  usuario: string;
  acao: AuditAcao;
  tipo: AuditTipo;
  alvo: string;
  descricao: string;
  data: string;
}

const STORAGE_KEY = "admin_audit_logs";
const CHANGE_EVENT = "admin_audit_logs_changed";

const SEED: AuditLogEntry[] = [
  {
    id: "log-seed-1",
    usuario: "admin@guardiao.app",
    acao: "Aprovado",
    tipo: "organizador",
    alvo: "Diocese de Aparecida",
    descricao: "Cadastro inicial validado.",
    data: "2026-04-10T14:32:00.000Z",
  },
  {
    id: "log-seed-2",
    usuario: "admin@guardiao.app",
    acao: "Suspenso",
    tipo: "organizador",
    alvo: "Shalom BH",
    descricao: "Suspenso após denúncia de cobrança indevida.",
    data: "2026-02-16T10:05:00.000Z",
  },
  {
    id: "log-seed-3",
    usuario: "admin@guardiao.app",
    acao: "Pago",
    tipo: "repasse",
    alvo: "Paróquia São José — R$ 4.250,00",
    descricao: "Transferência via PIX concluída.",
    data: "2026-05-18T09:15:00.000Z",
  },
];

const read = (): AuditLogEntry[] => {
  if (typeof window === "undefined") return SEED;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as AuditLogEntry[];
  } catch {
    return SEED;
  }
};

const write = (entries: AuditLogEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

export const useAuditLog = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>(() => read());

  useEffect(() => {
    const refresh = () => setEntries(read());
    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const log = useCallback(
    (input: Omit<AuditLogEntry, "id" | "usuario" | "data"> & { usuario?: string }) => {
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        usuario: input.usuario ?? user?.email ?? "admin@guardiao.app",
        data: new Date().toISOString(),
        acao: input.acao,
        tipo: input.tipo,
        alvo: input.alvo,
        descricao: input.descricao,
      };
      const next = [entry, ...read()];
      write(next);
      setEntries(next);
      return entry;
    },
    [user?.email],
  );

  return { entries, log };
};

// ============================================================
//  Logs de auditoria persistidos no Supabase (migration 012).
//  Substitui o localStorage para as ações administrativas reais.
// ============================================================

export type { AuditLog };

export type AuditLogAction =
  | "APROVAR_ORGANIZADOR"
  | "REJEITAR_ORGANIZADOR"
  | "SUSPENDER_ORGANIZADOR"
  | "REATIVAR_ORGANIZADOR"
  | "APROVAR_REPASSE"
  | "REJEITAR_REPASSE"
  | "PAGAR_REPASSE"
  | "ALTERAR_TAXA_PLATAFORMA"
  | "ALTERAR_CONFIGURACOES"
  | "SUSPENDER_USUARIO"
  | "EDITAR_USUARIO"
  | (string & {});

export type AuditLogEntityType =
  | "organization"
  | "withdrawal_request"
  | "user"
  | "platform_settings"
  | (string & {});

export interface CreateAuditLogInput {
  action: AuditLogAction;
  entity_type: AuditLogEntityType;
  entity_id?: string | null;
  details?: Record<string, unknown>;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  limit?: number;
}

/** Lista os logs de auditoria do Supabase (mais recentes primeiro). */
export const useAuditLogs = (filtros?: AuditLogFilters) => {
  return useQuery({
    queryKey: [
      "audit-logs",
      filtros?.action ?? null,
      filtros?.entity_type ?? null,
      filtros?.limit ?? 200,
    ],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filtros?.limit ?? 200);
      if (filtros?.action) q = q.eq("action", filtros.action);
      if (filtros?.entity_type) q = q.eq("entity_type", filtros.entity_type);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AuditLog[];
    },
  });
};

/** Insere um log de auditoria atribuído ao usuário autenticado. */
export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAuditLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("audit_logs")
        .insert({
          actor_id: user?.id ?? null,
          actor_email: user?.email ?? null,
          action: input.action,
          entity_type: input.entity_type,
          entity_id: input.entity_id ?? null,
          details: (input.details ?? {}) as never,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AuditLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    },
  });
};
