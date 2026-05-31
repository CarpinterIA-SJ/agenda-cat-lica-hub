import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

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
