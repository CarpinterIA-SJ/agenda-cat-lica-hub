import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Monitor,
  Blend,
  Info,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  event: any;
}

const eventTypes = [
  { id: "presencial", label: "Evento presencial", icon: MapPin },
  { id: "online", label: "Evento online", icon: Monitor },
  { id: "hibrido", label: "Híbrido", icon: Blend },
];

const categories = [
  "Congressos ou Seminários",
  "Retiros",
  "Missas e Celebrações",
  "Festas e Eventos Sociais",
  "Cursos e Workshops",
  "Encontros e Grupos",
  "Outros",
];

export const EventGeneralSettingsTab = ({ event }: Props) => {
  const [eventType, setEventType] = useState(event.event_type || "online");
  const [eventName, setEventName] = useState(event.name || "");
  const [customUrl, setCustomUrl] = useState(event.custom_url || "");
  const [category, setCategory] = useState(event.category || "");
  const [visibility, setVisibility] = useState(event.visibility || "public");
  const [whatsapp, setWhatsapp] = useState(event.whatsapp || "");
  const [startDate, setStartDate] = useState(event.start_date || "");
  const [startTime, setStartTime] = useState(event.start_time || "");
  const [endDate, setEndDate] = useState(event.end_date || "");
  const [endTime, setEndTime] = useState(event.end_time || "");

  const handleSave = () => {
    toast.success("Informações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Tipo de evento */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b-2 border-primary pb-2 inline-block">
            Tipo de evento
          </h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {eventTypes.map((type) => {
              const isSelected = eventType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setEventType(type.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span>{type.label}</span>
                  <type.icon className="w-4 h-4 ml-auto opacity-50" />
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Organizador */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b-2 border-primary pb-2 inline-block">
            Organizador
          </h3>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">
                <span className="text-destructive">*</span> Selecione o organizador do evento:
              </Label>
              <div className="flex gap-3 mt-1.5">
                <Select defaultValue="default">
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um organizador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Organizador Principal</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold shrink-0">
                  <Plus className="w-4 h-4" /> Adicionar organizador
                </Button>
              </div>
            </div>

            {/* WhatsApp info */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-foreground">Atenção</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Adicione um número de Whatsapp no campo abaixo para receber notificações e alertas da plataforma e para que os participantes possam entrar em contato e tirar dúvidas específicas sobre esse evento.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Na página do evento, aparecerá um botão flutuante do Whatsapp. Quando as pessoas clicarem nesse botão, as conversas serão redirecionadas para esse número de Whatsapp informado abaixo.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                <span className="text-destructive">*</span> Whatsapp de suporte do evento:
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 px-3 h-10 bg-muted rounded-lg border text-sm shrink-0">
                  🇧🇷 <ChevronIcon />
                </div>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações básicas */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b-2 border-primary pb-2 inline-block">
            Informações básicas
          </h3>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">
                <span className="text-destructive">*</span> Nome do evento:
              </Label>
              <Input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Nome do evento"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">
                <span className="text-destructive">*</span> Endereço da página:
              </Label>
              <p className="text-xs text-primary mt-0.5">
                https://evento.guardianeventos.com/<span className="font-semibold">{customUrl || "meuevent"}</span>
              </p>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="url-personalizada"
                  className="flex-1"
                />
                <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/5 font-semibold shrink-0">
                  Verificar
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">
                <span className="text-destructive">*</span> Categoria do evento:
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visibilidade */}
            <div className="bg-muted/50 rounded-xl p-5 space-y-3 border">
              <h4 className="font-semibold text-sm text-foreground">Visibilidade do evento</h4>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Meu evento é público</p>
                    <p className="text-xs text-muted-foreground">Seu evento fica visível em toda a plataforma</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Meu evento é privado</p>
                    <p className="text-xs text-muted-foreground">Apenas pessoas com o link do seu evento podem visualizá-lo</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data e horário */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b-2 border-primary pb-2 inline-block">
            Data e horário
          </h3>

          <div className="space-y-6 mt-4">
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Início do evento</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    <span className="text-destructive">*</span> Data:
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    <span className="text-destructive">*</span> Horário:
                  </Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Término do evento</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    <span className="text-destructive">*</span> Data:
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    <span className="text-destructive">*</span> Horário:
                  </Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8 font-semibold">
          Salvar
        </Button>
      </div>
    </div>
  );
};

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);
