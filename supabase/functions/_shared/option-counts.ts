// ============================================================
//  Helper compartilhado — vagas por opção (Fase C).
//  Extrai, das respostas do participante, as opções escolhidas que
//  possuem limite no schema do evento (events.custom_fields[].option_limits).
//  Usado por stripe-checkout (pré-checagem) e webhook/reconcile (tally).
// ============================================================

export interface OptionSelection {
  field_id: string;
  option_label: string;
  /** Limite configurado (usado no soft-gate do checkout; a RPC relê do banco). */
  limit: number;
}

/**
 * @param schema  events.custom_fields (array de campos)
 * @param answers event_registrations.custom_fields (objeto fieldId → resposta)
 */
export function buildLimitedSelections(schema: unknown, answers: unknown): OptionSelection[] {
  const out: OptionSelection[] = [];
  const fields = Array.isArray(schema) ? schema : [];
  const ans = answers && typeof answers === "object" ? (answers as Record<string, unknown>) : {};
  for (const f of fields as any[]) {
    const limits = f?.option_limits;
    if (!limits || typeof limits !== "object") continue;
    const val = ans[f.id];
    const chosen = Array.isArray(val) ? val : val != null && val !== "" ? [val] : [];
    for (const opt of chosen) {
      const label = String(opt);
      const lim = Number((limits as Record<string, unknown>)[label]);
      if (Number.isFinite(lim) && lim >= 1) {
        out.push({ field_id: String(f.id), option_label: label, limit: lim });
      }
    }
  }
  return out;
}
