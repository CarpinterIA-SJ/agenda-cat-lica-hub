import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CameraOff, Loader2, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRCodeReaderProps {
  /** Chamado a cada QR Code detectado. Recebe o texto bruto lido. */
  onScan: (result: string) => void;
  /** Pausa entre leituras do mesmo código, em ms. Default 1500. */
  scanCooldownMs?: number;
}

const READER_ELEMENT_ID = "qr-code-reader-region";

/**
 * Leitor de QR Code que acessa a câmera do dispositivo via html5-qrcode.
 * Mantém o visor ativo após cada leitura para permitir check-ins em sequência.
 */
const QRCodeReader = ({ onScan, scanCooldownMs = 1500 }: QRCodeReaderProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const [status, setStatus] = useState<"starting" | "scanning" | "stopped" | "error">("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // Ignora erros ao parar — câmera já pode estar liberada.
    }
    scannerRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(READER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const now = Date.now();
          const last = lastScanRef.current;
          // Debounce: ignora releituras rápidas do mesmo código.
          if (last && last.text === decodedText && now - last.at < scanCooldownMs) return;
          lastScanRef.current = { text: decodedText, at: now };
          onScanRef.current(decodedText);
        },
        () => {
          // Falha de leitura por frame (sem QR no quadro) — silenciosa.
        },
      )
      .then(() => {
        if (!cancelled) setStatus("scanning");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(friendlyCameraError(err));
      });

    return () => {
      cancelled = true;
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = async () => {
    await stopScanner();
    setStatus("stopped");
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
        {/* Região de vídeo controlada pelo html5-qrcode */}
        <div id={READER_ELEMENT_ID} className="w-full [&_video]:w-full [&_video]:object-cover" />

        {/* Moldura de mira */}
        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[250px] w-[250px] rounded-2xl border-2 border-[#004d00] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}

        {status === "starting" && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-slate-300">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm font-medium">Iniciando câmera…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-200">
            <CameraOff className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {status === "stopped" && (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-slate-300">
            <XCircle className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium">Leitura encerrada.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <ScanLine className="h-4 w-4 text-[#004d00]" />
          {status === "scanning" ? "Aponte para o QR Code do ingresso" : "Câmera inativa"}
        </p>
        <Button
          variant="outline"
          onClick={handleStop}
          disabled={status !== "scanning" && status !== "starting"}
          className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <CameraOff className="h-4 w-4" />
          Parar leitura
        </Button>
      </div>
    </div>
  );
};

/** Traduz erros da câmera em mensagens amigáveis em pt-BR. */
function friendlyCameraError(err: unknown): string {
  const raw = typeof err === "string" ? err : (err as { name?: string; message?: string })?.name ?? (err as Error)?.message ?? "";
  const text = String(raw).toLowerCase();

  if (text.includes("notallowed") || text.includes("permission") || text.includes("denied")) {
    return "Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador e tente novamente.";
  }
  if (text.includes("notfound") || text.includes("devices") || text.includes("no camera")) {
    return "Nenhuma câmera encontrada neste dispositivo.";
  }
  if (text.includes("notreadable") || text.includes("inuse") || text.includes("track")) {
    return "Não foi possível acessar a câmera. Ela pode estar em uso por outro aplicativo.";
  }
  if (text.includes("secure") || text.includes("https")) {
    return "A câmera exige uma conexão segura (HTTPS).";
  }
  return "Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.";
}

export default QRCodeReader;
