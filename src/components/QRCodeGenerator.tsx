import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeGeneratorProps {
  /** Id da inscrição (event_registrations.id). */
  registrationId: string;
  /** Id do evento — compõe o conteúdo do QR Code. */
  eventId: string;
  /** Nome do evento (opcional) — usado no nome do arquivo PNG. */
  eventName?: string;
  /** Tamanho do QR em pixels. Default 200. */
  size?: number;
}

/** Remove acentos/caracteres especiais para um nome de arquivo seguro. */
const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "ingresso";

/**
 * Gera o QR Code de um ingresso. O conteúdo codificado é
 * `GUARDIAO:<registrationId>:<eventId>` — exatamente o formato esperado
 * pelo leitor de check-in (QRCodeReader / CheckinsPage).
 */
const QRCodeGenerator = ({ registrationId, eventId, eventName, size = 200 }: QRCodeGeneratorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const qrValue = `GUARDIAO:${registrationId}:${eventId}`;

  const handleDownload = () => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${slugify(eventName ?? registrationId)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-slate-200 bg-white p-6">
      <div ref={containerRef} className="rounded-md border border-slate-200 bg-white p-3">
        <QRCodeCanvas
          value={qrValue}
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
