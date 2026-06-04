import { useRef, useState } from "react";
import { Calendar, ChevronLeft, PlayCircle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCheckins, useCheckinTypes, useCreateCheckin } from "@/hooks/use-checkins";
import { supabase } from "@/integrations/supabase/client";
import QRCodeReader from "@/components/QRCodeReader";

const ACCESS_POINTS: Record<string, string> = {
  main_entrance: "Entrada Principal",
  side_entrance: "Entrada Lateral",
  backstage: "Backstage",
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Extrai o registrationId do conteúdo lido. Aceita o id cru (uuid) e também
 * o formato dos ingressos emitidos: `GUARDIAO:<registrationId>:<eventId>`.
 */
function extractRegistrationId(scanned: string): string | null {
  const trimmed = scanned.trim();
  if (trimmed.startsWith("GUARDIAO:")) {
    const parts = trimmed.split(":");
    if (parts[1] && UUID_RE.test(parts[1])) return parts[1];
  }
  const match = trimmed.match(UUID_RE);
  return match ? match[0] : null;
}

const CheckinsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: checkins = [] } = useCheckins(id);
  const { data: checkinTypes = [] } = useCheckinTypes(id);
  const createCheckin = useCreateCheckin();

  const [checkinTypeId, setCheckinTypeId] = useState<string>("");
  const [accessPoint, setAccessPoint] = useState<string>("");
  const [scannerOpen, setScannerOpen] = useState(false);

  // Evita processar duas leituras simultâneas enquanto uma consulta está em voo.
  const processingRef = useRef(false);

  const handleStartCheckin = () => {
    if (!accessPoint || (checkinTypes.length > 0 && !checkinTypeId)) {
      toast({
        title: "Erro de validação",
        description: "Selecione o tipo e o ponto de acesso antes de iniciar.",
        variant: "destructive",
      });
      return;
    }
    setScannerOpen(true);
  };

  const handleScan = async (scanned: string) => {
    if (processingRef.current) return;

    const registrationId = extractRegistrationId(scanned);
    if (!registrationId) {
      toast({
        title: "QR Code inválido",
        description: "Não foi possível ler o código do ingresso.",
        variant: "destructive",
      });
      return;
    }

    processingRef.current = true;
    try {
      // 1. Busca a inscrição pelo id lido.
      const { data: registration, error } = await supabase
        .from("event_registrations")
        .select("id, event_id, status, full_name")
        .eq("id", registrationId)
        .maybeSingle();
      if (error) throw error;

      // 2./8. Não encontrada ou pertence a outro evento.
      if (!registration || registration.event_id !== id) {
        toast({
          title: "Ingresso não encontrado",
          description: "Este QR Code não corresponde a um ingresso deste evento.",
          variant: "destructive",
        });
        return;
      }

      // 3./7. Ingresso não confirmado.
      if (registration.status !== "confirmed") {
        toast({
          title: "Ingresso não confirmado",
          description: `O ingresso de ${registration.full_name} está com status "${registration.status}".`,
          variant: "destructive",
        });
        return;
      }

      // 4. Já existe check-in para este registration_id + checkin_type_id?
      let existingQuery = supabase
        .from("checkins")
        .select("id")
        .eq("registration_id", registration.id)
        .limit(1);
      existingQuery = checkinTypeId
        ? existingQuery.eq("checkin_type_id", checkinTypeId)
        : existingQuery.is("checkin_type_id", null);
      const { data: existing, error: existErr } = await existingQuery;
      if (existErr) throw existErr;

      // 6. Já fez check-in → aviso amarelo.
      if (existing && existing.length > 0) {
        toast({
          title: "Check-in já realizado",
          description: `${registration.full_name} já fez check-in neste ponto.`,
          className: "bg-amber-500 text-white border-amber-500",
        });
        return;
      }

      // 5. Tudo certo → registra e mostra sucesso verde.
      await createCheckin.mutateAsync({
        event_id: id!,
        registration_id: registration.id,
        checkin_type_id: checkinTypeId || null,
        performed_by: user?.id ?? null,
        notes: ACCESS_POINTS[accessPoint] ?? null,
      });

      toast({
        title: "Check-in confirmado ✓",
        description: `${registration.full_name} liberado para entrada.`,
        className: "bg-[#004d00] text-white border-[#004d00]",
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") {
        // Conflito de unicidade (registration_id, checkin_type_id) = já registrado.
        toast({
          title: "Check-in já realizado",
          description: "Este ingresso já passou por este ponto de acesso.",
          className: "bg-amber-500 text-white border-amber-500",
        });
      } else {
        toast({
          title: "Erro ao processar check-in",
          description: (err as Error)?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      processingRef.current = false;
    }
  };

  const selectedTypeName = checkinTypes.find((t) => t.id === checkinTypeId)?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold uppercase text-slate-900">
              FABRICIO CHRISTIAN DA SILVA CAVALCANTE
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="w-4 h-4" />
            <span>{checkins.length} check-in(s) realizado(s)</span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/organizador/meus-eventos")}
          className="gap-2 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para os meus eventos
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-orange-800 text-sm md:text-base leading-relaxed max-w-[80%]">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para
          solicitar repasses de seu evento. Em caso de dúvidas, acesse:{" "}
          <Link to="#" className="text-blue-600 font-medium hover:underline">
            Central de Ajuda
          </Link>
          .
        </p>
        <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shrink-0" onClick={() => navigate("/minha-conta")}>
          Atualizar dados
        </Button>
      </div>

      {/* Check-in Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Realizar check-in</h2>
          <div className="h-1 w-16 bg-[#004d00]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Select: Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              Selecione o tipo <span className="text-red-500">*</span>
            </label>
            <Select value={checkinTypeId} onValueChange={setCheckinTypeId} disabled={checkinTypes.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={checkinTypes.length === 0 ? "Nenhum tipo configurado" : "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent>
                {checkinTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select: Access Point */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              Ponto de acesso <span className="text-red-500">*</span>
            </label>
            <Select value={accessPoint} onValueChange={setAccessPoint}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCESS_POINTS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Button: Start Check-in */}
          <Button
            onClick={handleStartCheckin}
            className="w-full gap-2 bg-[#004d00] hover:bg-[#003300] text-white"
          >
            <PlayCircle className="w-5 h-5" />
            Iniciar check-in
          </Button>
        </div>
      </div>

      {/* Recent check-ins */}
      {checkins.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Últimos check-ins</h3>
          <ul className="divide-y divide-slate-100">
            {checkins.slice(0, 10).map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <CheckCircle2 className="w-5 h-5 text-[#004d00] shrink-0" />
                <span className="flex-1 font-medium text-slate-800">
                  {c.registration?.full_name ?? "Participante"}
                </span>
                <span className="text-sm text-slate-400">
                  {new Date(c.checked_at).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Leitura de QR Code</DialogTitle>
            <DialogDescription>
              {selectedTypeName ? `${selectedTypeName} · ` : ""}
              {ACCESS_POINTS[accessPoint] ?? "Ponto de acesso"} — a câmera permanece ativa para leituras em sequência.
            </DialogDescription>
          </DialogHeader>
          {scannerOpen && <QRCodeReader onScan={handleScan} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckinsPage;
