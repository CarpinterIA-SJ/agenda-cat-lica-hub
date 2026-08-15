import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { useUpdateRegistrationStatus } from "@/hooks/use-registrations";
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
  XCircle,
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
  const queryClient = useQueryClient();
  const updateStatus = useUpdateRegistrationStatus();
  const [cancelOpen, setCancelOpen] = useState(false);

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

  // Só dispara pra evento pago: é o único caso em que o diálogo de
  // cancelamento precisa mostrar contato do organizador (033/034: gratuito
  // cancela direto pelo app, sem precisar contatar ninguém).
  const { data: organizerContact, isLoading: organizerContactLoading } = useQuery({
    queryKey: ["organizer-contact", registration?.event_id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_organizer_contact", {
        p_event_id: registration!.event_id,
      });
      if (error) throw error;
      return (data?.[0] ?? null) as { organization_name: string | null; contact_email: string | null } | null;
    },
    enabled: !!registration?.event_id && (registration?.ticket?.price_cents ?? 0) > 0,
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

  const organizerName: string | null = null;
  const organizerInitials = "GE";

  const paymentLabel: string | null = null;

  // Só inscrição confirmada pode ser cancelada: é a única transição que o
  // gatilho event_registrations_release_ticket (migration 034) trata —
  // ele devolve `sold` quando o status sai de 'confirmed'.
  const canCancel = registration.status === "confirmed";

  // Evento pago não cancela pelo app: o estorno passa pela política de
  // reembolso do organizador. Sem ticket vinculado (ticket_id null) a
  // inscrição é gratuita.
  const isPaid = (ticketDef?.price_cents ?? 0) > 0;

  // Lacuna conhecida da migration 033: `release_coupon_use` é service_role e
  // este caminho roda no cliente, então cancelar aqui NÃO devolve o uso do
  // cupom. Enquanto a RPC autorizada não existe, o aviso é explícito.
  const hasCoupon = !!registration.coupon_id;

  // organizations não tem telefone/whatsapp cadastrado em lugar nenhum
  // (036) — só contact_email. Sem ele, cai no e-mail de suporte da
  // plataforma, pra nunca deixar o participante sem nenhuma saída.
  const organizerEmail = organizerContact?.contact_email || PLATFORM_SUPPORT_EMAIL;
  const mailtoHref = `mailto:${organizerEmail}?subject=${encodeURIComponent(
    `Cancelamento — ${eventName}`,
  )}&body=${encodeURIComponent(
    `Olá,\n\nGostaria de solicitar o cancelamento da minha inscrição no evento "${eventName}".\n\nNº da inscrição: ${ticketCode}\nParticipante: ${participantName}\n\nAguardo retorno.`,
  )}`;

  const handleCancel = () => {
    updateStatus.mutate(
      { id: registration.id, status: "cancelled" },
      {
        onSuccess: () => {
          // O gatilho do banco já devolveu a vaga; invalidar ingressos e
          // eventos para a disponibilidade recarregar na UI.
          queryClient.invalidateQueries({ queryKey: ["registrations"] });
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
          queryClient.invalidateQueries({ queryKey: ["events"] });
          setCancelOpen(false);
          toast.success("Inscrição cancelada. A vaga foi liberada para outro participante.");
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Não foi possível cancelar a inscrição.");
        },
      },
    );
  };

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
          </div>
        </div>
      </div>

      {/* QR Code de acesso */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base border-b-2 border-primary pb-1 w-fit">
          Seu QR Code de acesso
        </h3>
        <p className="text-sm text-slate-500">Apresente este QR Code na entrada do evento.</p>
        <QRCodeGenerator
          registrationId={registration.id}
          eventId={registration.event_id}
          eventName={eventName}
        />
      </div>

      {/* Cancelamento — só para inscrição confirmada */}
      {canCancel && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-base border-b-2 border-primary pb-1 w-fit">
            Cancelamento
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <p className="text-sm text-slate-500">
              {isPaid
                ? "Este é um evento pago. O cancelamento e o eventual reembolso são tratados pelo organizador."
                : "Não vai mais participar? Cancele sua inscrição para liberar a vaga para outra pessoa."}
            </p>
            <Button
              variant="outline"
              className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 font-semibold"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="w-4 h-4" />
              Cancelar inscrição
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          {isPaid ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelamento de evento pago</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-left">
                    <p>
                      Inscrições pagas não são canceladas diretamente por aqui. Entre em contato com o
                      organizador de <b>{eventName}</b> para solicitar o cancelamento e o reembolso.
                    </p>
                    <p>
                      Pelo Código de Defesa do Consumidor (Art. 49), o reembolso é garantido em até 7 dias
                      após a compra. Fora desse prazo, vale a política de reembolso definida pelo organizador.
                    </p>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">
                        Contato para cancelamento
                      </p>
                      {organizerContactLoading ? (
                        <p className="text-sm text-slate-500">Carregando contato do organizador...</p>
                      ) : (
                        <>
                          <a
                            href={mailtoHref}
                            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline break-all"
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {organizerEmail}
                          </a>
                          {!organizerContact?.contact_email && (
                            <p className="text-xs text-slate-400">
                              Organizador sem contato cadastrado — este é o e-mail de suporte da plataforma.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Entendi</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar esta inscrição?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-left">
                    <p>
                      Sua inscrição em <b>{eventName}</b> será cancelada e a vaga será liberada
                      imediatamente para outro participante.
                    </p>
                    <p className="font-semibold text-red-600">
                      Esta ação não pode ser desfeita. Para participar de novo você precisará se inscrever
                      outra vez, sujeito à disponibilidade de vagas.
                    </p>
                    {hasCoupon && (
                      <p className="font-semibold text-red-600">
                        O cupom de desconto utilizado nesta inscrição <b>não será devolvido</b> e não poderá
                        ser reutilizado em uma nova inscrição.
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={updateStatus.isPending}>Voltar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    // Impede o fechamento automático do diálogo: ele só fecha
                    // no onSuccess, para o erro continuar visível em contexto.
                    e.preventDefault();
                    handleCancel();
                  }}
                  disabled={updateStatus.isPending}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {updateStatus.isPending ? "Cancelando..." : "Sim, cancelar inscrição"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyTicketDetailPage;
