import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeGeneratorProps {
  /** Id da inscrição (event_registrations.id) codificado no QR Code. */
  registrationId: string;
  /** Tamanho do QR em pixels. Default 200. */
  size?: number;
  /** Nome usado no arquivo PNG baixado. Default "ingresso". */
  fileName?: string;
}

/**
 * Gera o QR Code de um ingresso a partir do registrationId.
 * O código lido pelo leitor de check-in é exatamente esse registrationId.
 */
const QRCodeGenerator = ({ registrationId, size = 200, fileName = "ingresso" }: QRCodeGeneratorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div ref={containerRef} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <QRCodeCanvas
          value={registrationId}
          size={size}
          bgColor="#ffffff"
          fgColor="#1e293b"
          level="H"
          marginSize={1}
        />
      </div>

      <div className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Código do ingresso</p>
        <p className="mt-0.5 break-all font-mono text-sm font-semibold text-slate-700">{registrationId}</p>
      </div>

      <Button
        onClick={handleDownload}
        className="w-full gap-2 bg-[#004d00] text-white hover:bg-[#003300]"
      >
        <Download className="h-4 w-4" />
        Baixar QR Code (PNG)
      </Button>
    </div>
  );
};

export default QRCodeGenerator;
