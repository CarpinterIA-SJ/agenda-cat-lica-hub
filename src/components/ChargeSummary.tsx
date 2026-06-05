import { Info } from "lucide-react";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Calcula subtotal, taxa e total (em centavos) a partir do preço unitário em
 * centavos, quantidade e percentual de taxa da plataforma (ex.: 5 → 5%).
 */
export const computeCharge = (priceCents: number, quantity = 1, taxaPercent = 0) => {
  const subtotal = Math.round((priceCents || 0) * quantity);
  const taxa = Math.round(subtotal * (taxaPercent / 100));
  return { subtotal, taxa, total: subtotal + taxa };
};

interface ChargeSummaryProps {
  /** Valor do ingresso (em centavos), já considerando quantidade/desconto. */
  subtotalCents: number;
  /** Taxa da plataforma (em centavos). */
  taxaCents: number;
  /** Total a pagar (em centavos). */
  totalCents: number;
  /** Percentual da taxa para exibir no rótulo (ex.: 5 → "Taxa da plataforma (5%)"). */
  taxaPercent?: number;
  className?: string;
}

/**
 * Card destacado com o resumo de cobrança antes de confirmar a inscrição.
 * Ingresso gratuito exibe aviso de "sem cobrança".
 */
export const ChargeSummary = ({
  subtotalCents,
  taxaCents,
  totalCents,
  taxaPercent,
  className = "",
}: ChargeSummaryProps) => {
  if (subtotalCents <= 0) {
    return (
      <div className={`border border-emerald-200 bg-emerald-50 rounded-xl p-4 ${className}`}>
        <p className="text-sm font-semibold text-emerald-800 text-center">
          Inscrição gratuita — sem cobrança
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-emerald-900">
        <span>Valor do ingresso</span>
        <span>{brl(subtotalCents)}</span>
      </div>
      <div className="flex justify-between text-sm text-emerald-900">
        <span>Taxa da plataforma{taxaPercent != null ? ` (${taxaPercent}%)` : ""}</span>
        <span>{brl(taxaCents)}</span>
      </div>
      <div className="flex justify-between text-lg font-bold text-emerald-900 border-t border-emerald-200 pt-2">
        <span>Total a pagar</span>
        <span>{brl(totalCents)}</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-emerald-700 pt-1">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          A taxa de serviço é cobrada pela plataforma Guardião Eventos para manutenção e operação do
          sistema.
        </span>
      </div>
      <p className="text-[11px] text-emerald-700/80 italic border-t border-emerald-200 pt-2">
        Valores exibidos são informativos. A cobrança final é calculada e confirmada pelo servidor
        no momento do pagamento.
      </p>
    </div>
  );
};

export default ChargeSummary;
