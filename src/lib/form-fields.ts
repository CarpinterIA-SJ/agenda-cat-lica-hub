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

/** Normaliza um campo vindo do JSONB (retrocompat: type ausente → "text"). */
export const normalizeCustomField = (f: any): CustomFormField => {
  const type: CustomFieldType =
    f?.type === "radio" || f?.type === "checkbox" || f?.type === "select" ? f.type : "text";
  return {
    id: String(f?.id ?? Date.now().toString()),
    label: String(f?.label ?? ""),
    type,
    required: f?.required !== false,
    options: fieldHasOptions(type) && Array.isArray(f?.options) ? f.options.map(String) : undefined,
  };
};

/** Serializa para gravar em events.custom_fields (campo "text" não grava options). */
export const serializeCustomField = (f: CustomFormField) => {
  const base: Record<string, unknown> = { id: f.id, label: f.label, type: f.type, required: f.required };
  if (fieldHasOptions(f.type)) base.options = (f.options ?? []).filter((o) => o.trim().length > 0);
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
