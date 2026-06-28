// ============================================================
//  Campos personalizados do formulário de inscrição (Fase A).
//  Tipo compartilhado entre o construtor (organizador) e o
//  renderizador (participante). Armazenado em events.custom_fields
//  (JSONB). Retrocompatível: campos antigos sem `type` = "text".
// ============================================================

export type CustomFieldType = "text" | "radio" | "checkbox" | "select";

export interface CustomFormField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // presente apenas em radio/checkbox/select
  /**
   * Limite de vagas por opção (Fase C), opcional e por label.
   * Ausência de uma opção aqui = vagas ILIMITADAS para ela.
   * Ex: { "4 a 7 anos": 10 }
   */
  option_limits?: Record<string, number>;
}

export const CUSTOM_FIELD_TYPE_LABEL: Record<CustomFieldType, string> = {
  text: "Texto",
  radio: "Múltipla escolha",
  checkbox: "Caixas de seleção",
  select: "Lista suspensa",
};

/** Tipos que possuem lista de opções. */
export const fieldHasOptions = (t: CustomFieldType): boolean =>
  t === "radio" || t === "checkbox" || t === "select";

/** Normaliza limites por opção do JSONB: mantém só inteiros >= 1. */
const normalizeOptionLimits = (raw: any, options: string[]): Record<string, number> | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const label of options) {
    const n = Number(raw[label]);
    if (Number.isInteger(n) && n >= 1) out[label] = n;
  }
  return Object.keys(out).length ? out : undefined;
};

/** Normaliza um campo vindo do JSONB (retrocompat: type ausente → "text"). */
export const normalizeCustomField = (f: any): CustomFormField => {
  const type: CustomFieldType =
    f?.type === "radio" || f?.type === "checkbox" || f?.type === "select" ? f.type : "text";
  const options = fieldHasOptions(type) && Array.isArray(f?.options) ? f.options.map(String) : undefined;
  return {
    id: String(f?.id ?? Date.now().toString()),
    label: String(f?.label ?? ""),
    type,
    required: f?.required !== false,
    options,
    option_limits: options ? normalizeOptionLimits(f?.option_limits, options) : undefined,
  };
};

/** Serializa para gravar em events.custom_fields (campo "text" não grava options). */
export const serializeCustomField = (f: CustomFormField) => {
  const base: Record<string, unknown> = { id: f.id, label: f.label, type: f.type, required: f.required };
  if (fieldHasOptions(f.type)) {
    const options = (f.options ?? []).filter((o) => o.trim().length > 0);
    base.options = options;
    // Limites apenas para opções existentes e válidas; vazio = não grava (ilimitado).
    const limits = normalizeOptionLimits(f.option_limits, options);
    if (limits) base.option_limits = limits;
  }
  return base;
};

/** Exibição legível de uma resposta (array de checkbox → "a, b"; boolean → Sim/Não). */
export const formatAnswer = (value: unknown): string => {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  const s = String(value).trim();
  return s.length ? s : "—";
};
