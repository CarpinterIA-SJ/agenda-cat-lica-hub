import type { ReactNode } from "react";
import { Barcode, QrCode } from "lucide-react";
// Imports por bandeira, não pelo barrel: o barrel arrasta os 108 ícones × 6
// estilos e engordou o bundle em ~240 kB gzip numa medição.
import { VisaFlatRoundedIcon } from "react-svg-credit-card-payment-icons/visa";
import { MastercardFlatRoundedIcon } from "react-svg-credit-card-payment-icons/mastercard";
import { EloFlatRoundedIcon } from "react-svg-credit-card-payment-icons/elo";
import { AmericanExpressFlatRoundedIcon } from "react-svg-credit-card-payment-icons/americanexpress";

const CARD_ICON_WIDTH = 34;

// Pix e Boleto não são bandeiras de cartão e não existem em nenhuma lib de
// ícones de pagamento — seguem o mesmo vocabulário lucide que o
// AsaasCheckoutModal já usa para esses dois métodos.
const METHODS: { label: string; icon: ReactNode }[] = [
  { label: "Visa", icon: <VisaFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Mastercard", icon: <MastercardFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Elo", icon: <EloFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Amex", icon: <AmericanExpressFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Pix", icon: <QrCode className="h-[22px] w-[22px] text-[#0b3d2e]" /> },
  { label: "Boleto", icon: <Barcode className="h-[22px] w-[22px] text-[#0b3d2e]" /> },
];

export const PaymentMethodBadges = ({ className = "grid grid-cols-3 gap-2" }: { className?: string }) => (
  <div className={className}>
    {METHODS.map(({ label, icon }) => (
      <div
        key={label}
        className="flex flex-col items-center justify-center gap-1 rounded-md border border-[#dfe8df] bg-[#f6f8f6] px-2 py-2 text-center text-xs font-medium text-[#7a8c81]"
      >
        {icon}
        {label}
      </div>
    ))}
  </div>
);

export default PaymentMethodBadges;
