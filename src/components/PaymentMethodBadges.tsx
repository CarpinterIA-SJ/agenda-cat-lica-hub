import type { ReactNode } from "react";
import { Barcode } from "lucide-react";
// Imports por bandeira, não pelo barrel: o barrel arrasta os 108 ícones × 6
// estilos e engordou o bundle em ~240 kB gzip numa medição.
import { VisaFlatRoundedIcon } from "react-svg-credit-card-payment-icons/visa";
import { MastercardFlatRoundedIcon } from "react-svg-credit-card-payment-icons/mastercard";
import { EloFlatRoundedIcon } from "react-svg-credit-card-payment-icons/elo";
import { DinersClubFlatRoundedIcon } from "react-svg-credit-card-payment-icons/dinersclub";
import { AmericanExpressFlatRoundedIcon } from "react-svg-credit-card-payment-icons/americanexpress";

const CARD_ICON_WIDTH = 34;

// Símbolo oficial do Pix (Banco Central), path do Simple Icons (CC0) —
// nenhuma lib de bandeiras de cartão inclui o Pix.
const PixLogo = () => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="#32BCAD" aria-hidden="true">
    <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" />
  </svg>
);

// Boleto não tem logo oficial (a Febraban não define marca) — o código de
// barras é o símbolo universal, mesmo ícone que o AsaasCheckoutModal usa.
const METHODS: { label: string; icon: ReactNode }[] = [
  { label: "Visa", icon: <VisaFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Mastercard", icon: <MastercardFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Elo", icon: <EloFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Diners", icon: <DinersClubFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Amex", icon: <AmericanExpressFlatRoundedIcon width={CARD_ICON_WIDTH} /> },
  { label: "Boleto", icon: <Barcode className="h-[22px] w-[22px] text-[#0b3d2e]" /> },
  { label: "Pix", icon: <PixLogo /> },
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
