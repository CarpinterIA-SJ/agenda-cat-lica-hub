import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  CalendarDays,
  Hash,
  User,
  Mail,
  Phone,
  DollarSign,
  Clock,
} from "lucide-react";

const locationLabel = (loc: any): string | null => {
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  return loc.name || loc.city || loc.address || null;
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  waitlist: "Fila de espera",
};

const formatDate = (raw?: string) => {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return raw;
  }
};

const formatDateTime = (raw?: string) => {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return raw;
  }
};

const InfoRow = ({
  label,
  value,
  icon: Icon,
  valueClass = "",
  badge,
}: {
  label: string;
  value?: string | null;
  icon?: React.ElementType;
  valueClass?: string;
  badge?: boolean;
}) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</span>
    {badge && value ? (
      <Badge variant="outline" className="w-fit text-xs font-semibold border-amber-300 bg-amber-50 text-amber-700 px-2">
        {value}
      </Badge>
    ) : (
      <span className={`text-sm font-semibold text-slate-800 flex items-start gap-1.5 min-w-0 ${valueClass}`}>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
        <span className="break-words min-w-0">{value || "—"}</span>
      </span>
    )}
  </div>
);

const MyTicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: registration, isLoading } = useQuery({
    queryKey: ["registrations", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, event:events(*), ticket:event_tickets(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500">Ingresso não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/participante/meus-ingressos")}>
          Voltar para Meus Ingressos
        </Button>
      </div>
    );
  }

  const event = registration.event ?? null;
  const ticketDef = registration.ticket ?? null;

  const participantName = registration.full_name || "—";
  const cpf = registration.cpf || null;
  const email = registration.email || null;
  const phone = registration.phone || null;
  const birthDate = formatDate(registration.birth_date || undefined);

  const eventName = event?.name ?? "Evento";
  const eventLocation = locationLabel(event?.location);

  const eventDateLabel = formatDateTime(event?.start_at || undefined);

  const registrationDateLabel = formatDateTime(registration.registered_at || undefined);

  const ticketName = ticketDef?.name || "Ingresso";
  const ticketPrice = ticketDef
    ? ticketDef.price_cents === 0
      ? "Gratuito"
      : `R$ ${(ticketDef.price_cents / 100).toFixed(2).replace(".", ",")}`
    : null;

  const ticketCode = `#${String(registration.id).toUpperCase().slice(-10)}`;
  const qrValue = `GUARDIAO:${registration.id}:${registration.event_id}`;

  const organizerName: string | null = null;
  const organizerInitials = "GE";

  const paymentLabel: string | null = null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Resumo do pedido</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/participante/meus-ingressos")}
          className="gap-1.5 text-primary hover:text-primary/80 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Order Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Event Header */}
        <div className="p-5 flex gap-4 items-start">
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
            {event?.banner_url ? (
              <img src={event.banner_url} alt={eventName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-xs font-bold text-primary">
                  {eventName.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            {eventDateLabel && (
              <p className="text-sm font-bold text-primary flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {eventDateLabel}
              </p>
            )}
            <h2 className="font-bold text-slate-900 text-base leading-snug">{eventName}</h2>
            {eventLocation && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {eventLocation}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Order Details Grid */}
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5 overflow-hidden">
          <InfoRow label="Número do pedido" value={String(registration.id).slice(-10).toUpperCase()} icon={Hash} />
          <InfoRow label="Status" value={STATUS_LABEL[registration.status] ?? registration.status} badge />
          <InfoRow label="Pedido realizado por" value={participantName} icon={User} />
          <InfoRow label="E-mail" value={email} icon={Mail} />
          {phone && <InfoRow label="Telefone" value={phone} icon={Phone} />}
          {registrationDateLabel && (
            <InfoRow label="Data da inscrição" value={registrationDateLabel} icon={Clock} />
          )}
          {paymentLabel && (
            <InfoRow label="Forma de pagamento" value={paymentLabel} badge />
          )}
          {ticketPrice && (
            <InfoRow
              label="Valor total"
              value={ticketPrice}
              icon={DollarSign}
              valueClass="text-emerald-600"
            />
          )}
        </div>
      </div>

      {/* Organizer Card */}
      {organizerName && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-base border-b-2 border-primary pb-1 w-fit">
            Realização
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
              {organizerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{organizerName}</p>
              <p className="text-sm text-slate-500">Organizador do evento</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 hover:border-primary font-semibold shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com o organizador
            </Button>
          </div>
        </div>
      )}

      {/* Ticket Card */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base border-b-2 border-primary pb-1 w-fit">
          Ingressos
        </h3>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Ticket Type Header */}
          <div className="px-5 pt-5 pb-3">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-500">
              {ticketName}
            </span>
          </div>

          <Separator />

          {/* Participant Details */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Participante</p>
                <p className="text-sm font-semibold text-slate-800">{participantName}</p>
              </div>
              {email && (
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">E-mail</p>
                  <p className="text-sm font-semibold text-slate-800">{email}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {cpf && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Documento</p>
                    <p className="text-sm font-semibold text-slate-800 font-mono">{cpf}</p>
                  </div>
                )}
                {birthDate && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Data de nascimento</p>
                    <p className="text-sm font-semibold text-slate-800">{birthDate}</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-200 text-slate-600 hover:border-primary hover:text-primary font-semibold"
            >
              Editar dados
            </Button>
          </div>

          <Separator />

          {/* Ticket Footer — code + QR */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Nº da inscrição</p>
                <p className="text-sm font-bold font-mono text-slate-800">{ticketCode}</p>
              </div>
              {ticketPrice && (
                <div className="text-right">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Valor</p>
                  <p className="text-sm font-bold text-emerald-600">{ticketPrice}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-start">
              <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm inline-block">
                <QRCodeCanvas
                  id="ticket-qr"
                  value={qrValue}
                  size={140}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                  level="H"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTicketDetailPage;
