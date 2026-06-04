import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Calendar, MapPin, Users, Ticket, User, Mail, ChevronRight,
  Phone, CreditCard, AlertTriangle, Fingerprint, Video, ArrowRight, Lock,
  Headset, MessageCircle, Tag, Building2, ClipboardList, Eye, Filter, X, Percent,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/use-events";
import { useCreateRegistration } from "@/hooks/use-registrations";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ChargeSummary, computeCharge } from "@/components/ChargeSummary";

const formatLabelMap: Record<string, string> = {
  presencial: "Evento presencial",
  online: "Evento online",
  hibrido: "Evento híbrido",
};

const locationToString = (loc: any): string => {
  if (!loc) return "Local a definir";
  if (typeof loc === "string") return loc;
  return loc.name || loc.city || loc.address || "Local a definir";
};

// Mapeia uma linha de `events` do Supabase para o view-model usado pela UI legada.
const eventToVM = (e: any) => {
  const sf: any = e.show_fields ?? {};
  return {
    id: e.id,
    name: e.name,
    slug: e.slug,
    date: e.start_at
      ? new Date(e.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      : "A definir",
    time: e.start_at ? new Date(e.start_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
    startDateTime: e.start_at || "",
    location: locationToString(e.location),
    type: formatLabelMap[e.format] || "Evento presencial",
    category: e.category || "",
    status: e.status === "active" ? "Ativo" : e.status,
    bannerUrl: e.banner_url || "",
    descriptionText: e.description_text || "",
    description: e.description || "",
    organizerName: "",
    attendees: 0,
    show_nome: sf.nome ?? true,
    show_email: sf.email ?? true,
    show_cpf: sf.cpf ?? true,
    show_nascimento: sf.nascimento ?? false,
    show_whatsapp: sf.whatsapp ?? true,
    custom_fields: Array.isArray(e.custom_fields) ? e.custom_fields : [],
    tickets: [] as any[],
  };
};

export const PublicEventPage = ({ event: eventProp }: { event?: any }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createRegistration = useCreateRegistration();
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [checkout, setCheckout] = useState<{ ticketId: string; name: string; quantity: number } | null>(null);
  const [registering, setRegistering] = useState(false);

  const { data: fetched } = useQuery({
    queryKey: ["events", "public-slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data: ev, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!ev) return null;
      const { data: tickets } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("event_id", ev.id)
        .order("sort_order");
      const vm: any = eventToVM(ev);
      vm.tickets = (tickets ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        price: String((t.price_cents ?? 0) / 100),
        type: t.type,
      }));
      return vm;
    },
    enabled: !eventProp && !!slug,
  });

  const eventData = eventProp || fetched || null;

  const eventDate = useMemo(() => {
    if (!eventData) return null;
    if (eventData.startDateTime) return new Date(eventData.startDateTime);
    if (eventData.date) return new Date(`${eventData.date} ${eventData.time || ""}`);
    return null;
  }, [eventData]);

  useEffect(() => {
    if (!eventDate) return;
    const update = () => {
      const diff = Math.max(eventDate.getTime() - Date.now(), 0);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown({ days, hours, minutes, seconds });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  const organizerName = eventData?.organizerName || "Guardião Eventos";
  const organizerInitials = organizerName
    .split(" ")
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dateLabel = eventData?.date || (eventDate ? eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "");
  const timeLabel = eventData?.time || (eventDate ? eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");
  const policies = eventData?.policies || {
    title: "Política de cancelamento",
    text: "Entre em contato com o organizador caso precise alterar sua inscrição.",
    link: "#",
  };
  const tickets = eventData?.tickets || eventData?.details?.tickets || [];
  const primaryTicket = tickets[0];

  // Mapa do local — exibido para eventos com endereço (presencial/híbrido).
  const mapQuery =
    eventData?.location && eventData.location !== "Local a definir" && eventData.type !== "Evento online"
      ? eventData.location
      : null;
  const mapSrc = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=m&z=15&ie=UTF8&iwloc=&output=embed&hl=pt-BR`
    : null;
  const primaryPriceCents = primaryTicket ? Math.round(Number(primaryTicket.price || 0) * 100) : 0;
  const primaryCharge = computeCharge(primaryPriceCents, 1, taxaPercent);

  const handleBuy = async () => {
    if (!eventData?.id) return;
    if (!user) {
      toast.info("Entre na sua conta para se inscrever.");
      navigate("/login");
      return;
    }
    const priceCents = primaryTicket ? Math.round(Number(primaryTicket.price || 0) * 100) : 0;
    // Ingresso pago → checkout Stripe; gratuito → inscrição direta.
    if (primaryTicket && priceCents > 0) {
      setCheckout({ ticketId: primaryTicket.id, name: primaryTicket.name, quantity: 1 });
      return;
    }
    setRegistering(true);
    try {
      await createRegistration.mutateAsync({
        event_id: eventData.id,
        ticket_id: primaryTicket?.id ?? null,
        user_id: user.id,
        full_name: (user.user_metadata?.full_name as string) || "Participante",
        email: user.email || "",
        status: "confirmed",
      } as any);
      toast.success("Inscrição confirmada!");
      navigate("/participante/meus-ingressos");
    } catch (e: any) {
      toast.error("Erro ao confirmar inscrição", { description: e.message });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f6] font-sans">
      <header className="bg-white border-b border-[#dfe8df]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-sm font-semibold text-[#0b3d2e]">Guardião Eventos</div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-sm font-medium text-[#0b3d2e] hover:underline">Sou organizador</button>
            <Button onClick={() => navigate("/login")} className="h-9 px-5 bg-[#0b3d2e] text-white hover:bg-[#0a3225]">Entrar</Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {eventData?.bannerUrl && (
          <div className="rounded-3xl overflow-hidden border border-[#dfe8df] bg-white">
            <img src={eventData.bannerUrl} alt={eventData?.name || "Banner do evento"} className="w-full max-h-80 object-cover" />
          </div>
        )}
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2f5a47]">Evento</span>
                {eventData?.category && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2f5a47] bg-[#2f5a47]/10 px-2 py-0.5 rounded-full">
                    {eventData.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0b3d2e]">
                {eventData?.name || "Nome do Evento"}
              </h1>
              <p className="text-sm text-[#4b6355]">
                {eventData?.descriptionText || "Experiência organizada pela Guardião Eventos para sua comunidade."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4">
                <Calendar className="w-5 h-5 text-[#0b3d2e]" />
                <div>
                  <p className="text-xs uppercase text-[#7a8c81]">Data</p>
                  <p className="text-sm font-semibold text-[#0b3d2e]">{dateLabel} {timeLabel ? `às ${timeLabel}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4">
                <MapPin className="w-5 h-5 text-[#0b3d2e]" />
                <div>
                  <p className="text-xs uppercase text-[#7a8c81]">Local</p>
                  <p className="text-sm font-semibold text-[#0b3d2e]">{eventData?.location || "Local a definir"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe8df] bg-white p-4 sm:col-span-2">
                <Video className="w-5 h-5 text-[#0b3d2e]" />
                <div>
                  <p className="text-xs uppercase text-[#7a8c81]">Modalidade</p>
                  <p className="text-sm font-semibold text-[#0b3d2e]">{eventData?.type || "Evento online"}</p>
                </div>
              </div>
            </div>

            {mapSrc && (
              <div className="rounded-2xl border border-[#dfe8df] bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-sm font-semibold text-[#0b3d2e]">
                  <MapPin className="w-4 h-4" /> Localização
                </div>
                <iframe
                  src={mapSrc}
                  title="Mapa do local"
                  className="w-full"
                  style={{ minHeight: "260px", border: 0 }}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            )}

            <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
              <h2 className="text-sm font-semibold text-[#0b3d2e]">{policies.title}</h2>
              <p className="text-sm text-[#4b6355] mt-2">{policies.text}</p>
              <a href={policies.link} className="inline-flex items-center gap-1 text-sm font-medium text-[#0b3d2e] hover:underline mt-3">
                Saiba mais <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-[#0b3d2e]/20 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-[#7a8c81]">Inscrição</p>
                  <p className="text-xl font-bold text-[#0b3d2e]">
                    {primaryTicket ? primaryTicket.name : "Entrada disponível"}
                  </p>
                </div>
                <span className="rounded-full bg-[#0b3d2e]/10 px-3 py-1 text-sm font-semibold text-[#0b3d2e]">
                  {primaryTicket ? (Number(primaryTicket.price) === 0 ? "Gratuito" : `R$ ${primaryTicket.price}`) : "Consultar"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-3">
                {[
                  { label: "Dias", value: countdown.days },
                  { label: "Horas", value: countdown.hours },
                  { label: "Minutos", value: countdown.minutes },
                  { label: "Segundos", value: countdown.seconds },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#dfe8df] bg-[#f2f6f3] px-3 py-4 text-center">
                    <div className="text-xl font-bold text-[#0b3d2e]">{String(item.value).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase text-[#7a8c81]">{item.label}</div>
                  </div>
                ))}
              </div>

              {primaryTicket && (
                <ChargeSummary
                  className="mt-6"
                  subtotalCents={primaryCharge.subtotal}
                  taxaCents={primaryCharge.taxa}
                  totalCents={primaryCharge.total}
                  taxaPercent={primaryPriceCents > 0 ? taxaPercent : undefined}
                />
              )}

              <Button
                className="mt-6 w-full h-12 bg-[#0b3d2e] text-white hover:bg-[#0a3225]"
                onClick={handleBuy}
                disabled={registering}
              >
                {registering ? "Processando..." : "Garantir minha inscrição"}
              </Button>
              <p className="mt-3 text-xs text-[#7a8c81]">Pagamento seguro e confirmação imediata.</p>
            </div>

            <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0b3d2e]/10 text-[#0b3d2e] flex items-center justify-center font-bold">
                {organizerInitials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0b3d2e]">{organizerName}</p>
                <p className="text-xs text-[#7a8c81]">Organizador oficial</p>
              </div>
              <Button variant="outline" className="border-[#0b3d2e] text-[#0b3d2e] hover:bg-[#0b3d2e]/10">
                Falar com o organizador
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#0b3d2e]">Sobre o evento</h3>
            {eventData?.description ? (
              <div
                className="prose prose-sm max-w-none text-[#4b6355] mt-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(eventData.description) }}
              />
            ) : (
              <p className="text-sm text-[#4b6355] mt-2">
                Este evento foi pensado para proporcionar uma experiência acolhedora, com organização profissional e suporte completo.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#0b3d2e]">O que está incluso</h3>
            <ul className="mt-2 space-y-2 text-sm text-[#4b6355]">
              <li>• Confirmação imediata da inscrição</li>
              <li>• Suporte dedicado ao participante</li>
              <li>• Credenciamento rápido no dia do evento</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#dfe8df] bg-white p-5">
            <h3 className="text-sm font-semibold text-[#0b3d2e]">Precisa de ajuda?</h3>
            <p className="text-sm text-[#4b6355] mt-2">Nosso time está disponível para tirar suas dúvidas antes da inscrição.</p>
            <Button variant="outline" className="mt-4 border-[#0b3d2e] text-[#0b3d2e] hover:bg-[#0b3d2e]/10">
              Falar com atendimento
            </Button>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-sm p-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0b3d2e]">Formas de pagamento</h4>
            <div className="grid grid-cols-3 gap-2 text-xs text-[#7a8c81]">
              {["Visa", "Mastercard", "Elo", "Diners", "Amex", "Boleto", "Pix"].map((item) => (
                <div key={item} className="rounded-md border border-[#dfe8df] bg-[#f6f8f6] px-2 py-2 text-center font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0b3d2e]">Certificados</h4>
            <div className="flex items-center gap-2 rounded-lg border border-[#0b3d2e]/20 bg-[#0b3d2e]/5 px-3 py-2 text-sm font-semibold text-[#0b3d2e]">
              <Lock className="w-4 h-4" /> SITE 100% SEGURO
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#0b3d2e]">Precisa de ajuda?</h4>
            <button onClick={() => navigate("/support")} className="flex items-center gap-3 rounded-lg border border-[#dfe8df] bg-[#f6f8f6] px-4 py-3 text-sm font-medium text-[#0b3d2e] hover:border-[#0b3d2e] w-full text-left">
              <Headset className="w-5 h-5 text-[#0b3d2e]" />
              Central de atendimento - Tire suas dúvidas aqui
            </button>
          </div>
        </div>
      </footer>

      <a
        href="https://wa.me/"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {checkout && eventData?.id && (
        <CheckoutModal
          eventId={eventData.id}
          ticketId={checkout.ticketId}
          ticketName={checkout.name}
          quantity={checkout.quantity}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
};

type StandardFieldKey = "nome" | "email" | "cpf" | "nascimento" | "whatsapp";

type UnifiedField =
  | { kind: "standard"; key: StandardFieldKey; id: string; label: string; required: boolean; icon: any; inputType?: string; placeholder?: string; readOnly?: boolean; helper?: string }
  | { kind: "custom"; id: string; label: string; required: boolean; type?: string };

const buildUnifiedFields = (event: any): UnifiedField[] => {
  if (!event) return [];
  const fields: UnifiedField[] = [];
  if (event.show_nome !== false) {
    fields.push({ kind: "standard", key: "nome", id: "fixed_nome", label: "Nome completo", required: true, icon: User, placeholder: "Como deseja ser identificado" });
  }
  if (event.show_email !== false) {
    fields.push({ kind: "standard", key: "email", id: "fixed_email", label: "E-mail", required: true, icon: Mail, inputType: "email", readOnly: true, helper: "E-mail da sua conta Guardião." });
  }
  if (event.show_cpf !== false) {
    fields.push({ kind: "standard", key: "cpf", id: "fixed_cpf", label: "CPF", required: true, icon: Fingerprint, placeholder: "000.000.000-00" });
  }
  if (event.show_nascimento === true) {
    fields.push({ kind: "standard", key: "nascimento", id: "fixed_nascimento", label: "Data de nascimento", required: true, icon: Calendar, inputType: "date" });
  }
  if (event.show_whatsapp !== false) {
    fields.push({ kind: "standard", key: "whatsapp", id: "fixed_tel", label: "Telefone (WhatsApp)", required: true, icon: Phone, inputType: "tel", placeholder: "(00) 00000-0000" });
  }
  const custom = event.custom_fields || event.details?.formFields || [];
  custom.forEach((f: any) => {
    fields.push({ kind: "custom", id: f.id, label: f.label, required: f.required !== false, type: f.type || "text" });
  });
  return fields;
};

const formatTicketPriceRange = (tickets: any[]): string => {
  if (!tickets || tickets.length === 0) return "Gratuito";
  const prices = tickets.map((t) => Number(t.price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === 0 && max === 0) return "Gratuito";
  if (min === max) return `R$ ${min.toFixed(2).replace(".", ",")}`;
  return `R$ ${min.toFixed(2).replace(".", ",")} – R$ ${max.toFixed(2).replace(".", ",")}`;
};

const EVENT_CATEGORIES = [
  { value: "acampamentos", label: "Acampamentos" },
  { value: "catequese", label: "Catequese" },
  { value: "congressos", label: "Congressos e Seminários" },
  { value: "cursos", label: "Cursos e Workshops" },
  { value: "encontros", label: "Encontros de Formação" },
  { value: "diversos", label: "Eventos Diversos" },
  { value: "palestras", label: "Palestras" },
  { value: "retiros", label: "Retiros" },
  { value: "seminario-espirito", label: "Seminário de Vida no Espírito Santo" },
  { value: "shows", label: "Shows Católicos" },
];

const EVENT_TYPES = [
  { value: "Evento presencial", label: "Presencial" },
  { value: "Evento online", label: "Online" },
  { value: "Evento híbrido", label: "Híbrido" },
];

const ExploreEventsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<{ modo: "percentual" | "fixo"; valor: string; codigo: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkout, setCheckout] = useState<{ ticketId: string; name: string; quantity: number; coupon: string | null } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const createRegistration = useCreateRegistration();
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);

  const { data: rawEvents = [] } = useEvents({ visibility: "public", status: "active" });
  const eventIds = useMemo(() => rawEvents.map((e) => e.id), [rawEvents]);

  // Busca os preços dos ingressos de todos os eventos listados para o card exibir
  // o valor correto (a query de eventos não traz ingressos).
  const { data: ticketsByEvent = {} } = useQuery({
    queryKey: ["explore-ticket-prices", eventIds],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("event_id, price_cents, type")
        .in("event_id", eventIds);
      if (error) throw error;
      const map: Record<string, { price: string; type: string }[]> = {};
      (data ?? []).forEach((t: any) => {
        (map[t.event_id] ||= []).push({ price: String((t.price_cents ?? 0) / 100), type: t.type });
      });
      return map;
    },
  });

  useEffect(() => {
    setEvents(
      rawEvents.map((e) => {
        const vm = eventToVM(e);
        vm.tickets = ticketsByEvent[e.id] ?? [];
        return vm;
      }),
    );
  }, [rawEvents, ticketsByEvent]);

  const filtered = events.filter((e) => {
    if (!e.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
    if (selectedType !== "all" && e.type !== selectedType) return false;
    return true;
  });

  const activeFilters = (selectedCategory !== "all" ? 1 : 0) + (selectedType !== "all" ? 1 : 0);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedEvent) return;
    try {
      const { data: found, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("event_id", selectedEvent.id)
        .eq("code", couponCode.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!found) {
        setCouponError("Cupom inválido ou inativo.");
        setCouponDiscount(null);
        return;
      }
      if (found.max_uses != null && found.used_count >= found.max_uses) {
        setCouponError("Cupom esgotado.");
        setCouponDiscount(null);
        return;
      }
      setCouponDiscount({
        modo: found.discount_kind === "percent" ? "percentual" : "fixo",
        valor: String(found.discount_value),
        codigo: found.code,
      });
      setCouponError("");
    } catch {
      setCouponError("Erro ao validar cupom.");
    }
  };

  const calcDiscountedPrice = (price: number) => {
    if (!couponDiscount || price === 0) return price;
    if (couponDiscount.modo === "percentual") {
      return Math.max(0, price - price * (parseFloat(couponDiscount.valor) / 100));
    }
    return Math.max(0, price - parseFloat(couponDiscount.valor));
  };

  const handleOpenRegistration = async (event: any) => {
    // Busca os ingressos atuais do evento no Supabase para montar o modal.
    let latest = event;
    try {
      const { data: tickets } = await supabase
        .from("event_tickets")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order");
      latest = {
        ...event,
        tickets: (tickets ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          price: String((t.price_cents ?? 0) / 100),
          type: t.type,
        })),
      };
    } catch {
      // ignore
    }
    setSelectedEvent(latest);
    setSelectedTicketId(null);
    setSelectedPaymentMethod(null);
    setCouponCode("");
    setCouponDiscount(null);
    setCouponError("");
    const initialValues: Record<string, any> = {
      fixed_nome: user?.user_metadata?.full_name || "",
      fixed_cpf: "",
      fixed_tel: "",
      fixed_email: user?.email || "",
      fixed_nascimento: "",
    };
    const fields = latest.custom_fields || [];
    fields.forEach((f: any) => {
      initialValues[f.id] = f.type === "checkbox" ? false : "";
    });
    setFormValues(initialValues);
    setIsModalOpen(true);
  };

  const handleViewDetails = (event: any) => {
    const slug = event.slug || event.id;
    navigate(`/evento/${slug}`);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // A verificação de duplicidade por CPF agora é responsabilidade do backend (RLS/constraints).
  const isDuplicate = false;

  // When the organizer hasn't configured any ticket yet, fall back to a synthetic
  // free entry so the participant can still submit the form.
  const modalTickets = useMemo(() => {
    const configured = selectedEvent?.tickets || [];
    if (configured.length > 0) return configured;
    return [{ id: "default-free", name: "Inscrição gratuita", price: "0" }];
  }, [selectedEvent]);

  useEffect(() => {
    if (isModalOpen && modalTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(modalTickets[0].id);
    }
  }, [isModalOpen, modalTickets, selectedTicketId]);

  const unifiedFields = useMemo(() => buildUnifiedFields(selectedEvent), [selectedEvent]);

  const selectedTicket = modalTickets.find((t: any) => t.id === selectedTicketId);
  const selectedPriceCents = selectedTicket
    ? Math.round(calcDiscountedPrice(Number(selectedTicket.price || 0)) * 100)
    : 0;
  const selectedCharge = computeCharge(selectedPriceCents, 1, taxaPercent);

  const isFormValid = useMemo(() => {
    if (!selectedTicketId || isDuplicate) return false;
    return unifiedFields.every((f) => {
      if (!f.required) return true;
      const raw = formValues[f.id];
      if (typeof raw === "boolean") return raw;
      return typeof raw === "string" ? raw.trim().length > 0 : !!raw;
    });
  }, [selectedTicketId, formValues, unifiedFields, isDuplicate]);

  const handleRegister = async () => {
    if (!selectedEvent) return;

    // Ingresso pago → checkout obrigatório (Stripe). A inscrição só é criada
    // (pending) pelo backend e confirmada via webhook após o pagamento.
    if (selectedPriceCents > 0) {
      if (!user) {
        toast.info("Entre na sua conta para concluir o pagamento.");
        navigate("/login");
        return;
      }
      const ticketId = selectedTicketId && selectedTicketId !== "default-free" ? selectedTicketId : null;
      if (!ticketId) {
        toast.error("Selecione um ingresso válido para pagamento.");
        return;
      }
      setIsModalOpen(false);
      setCheckout({
        ticketId,
        name: selectedTicket?.name ?? "Ingresso",
        quantity: 1,
        coupon: couponDiscount?.codigo ?? null,
      });
      return;
    }

    // Coleta os valores dos campos customizados configurados pelo organizador.
    const customValues: Record<string, any> = {};
    (selectedEvent.custom_fields || []).forEach((f: any) => {
      customValues[f.id] = formValues[f.id];
    });
    try {
      await createRegistration.mutateAsync({
        event_id: selectedEvent.id,
        ticket_id: selectedTicketId && selectedTicketId !== "default-free" ? selectedTicketId : null,
        user_id: user?.id ?? null,
        full_name: formValues["fixed_nome"] || "",
        email: formValues["fixed_email"] || "",
        cpf: formValues["fixed_cpf"] || null,
        phone: formValues["fixed_tel"] || null,
        birth_date: formValues["fixed_nascimento"] || null,
        custom_fields: customValues as any,
        status: "confirmed",
      });
      toast.success("Inscrição confirmada!", {
        description: `Sua participação no evento "${selectedEvent?.name}" foi registrada.`,
      });
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error("Erro ao confirmar inscrição", { description: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Explorar Eventos</h1>
        <p className="text-muted-foreground mt-1">Descubra e inscreva-se nos eventos da sua comunidade</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar eventos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <Tag className="w-4 h-4 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {EVENT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[160px]">
            <Video className="w-4 h-4 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground"
            onClick={() => { setSelectedCategory("all"); setSelectedType("all"); }}>
            <X className="w-3 h-3" /> Limpar filtros ({activeFilters})
          </Button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
          <Calendar className="w-12 h-12 text-primary/30" />
          <p className="text-lg font-semibold">Nenhum evento disponível</p>
          <p className="text-sm">Os eventos criados pelos organizadores aparecerão aqui.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((event) => {
          const tickets = event.tickets || event.details?.tickets || [];
          const priceLabel = formatTicketPriceRange(tickets);
          const descriptionExcerpt = (event.descriptionText || "").trim();
          return (
            <Card key={event.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-all group border-l-4 border-l-transparent hover:border-l-primary overflow-hidden bg-card">
              <CardContent className="p-0 flex-1 flex flex-col">
                {event.bannerUrl ? (
                  <div className="h-36 w-full overflow-hidden bg-muted">
                    <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-primary/50" />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      event.status === "Ativo" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {event.status}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                      {event.type}
                    </span>
                    {event.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {event.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2 min-h-[3.5rem]">
                    {event.name}
                  </h3>
                  {descriptionExcerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{descriptionExcerpt}</p>
                  )}
                  <div className="space-y-2 text-sm text-muted-foreground mt-auto">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {event.date}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span className="truncate">{event.location}</span></div>
                    {event.organizerName && (
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span className="truncate">{event.organizerName}</span></div>
                    )}
                    <div className="flex items-center gap-2 font-medium text-foreground/70"><Users className="w-4 h-4 text-primary" /> {event.attendees || 0} inscritos</div>
                    <div className="flex items-center gap-2 font-semibold text-primary"><Ticket className="w-4 h-4" /> {priceLabel}</div>
                  </div>
                </div>
                <div className="p-5 bg-muted/30 border-t mt-auto flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto gap-2"
                    onClick={() => handleViewDetails(event)}
                  >
                    <Eye className="w-4 h-4" /> Ver detalhes
                  </Button>
                  <Button
                    disabled={event.status !== "Ativo"}
                    onClick={() => handleOpenRegistration(event)}
                    className="w-full sm:flex-1 gap-2 font-semibold"
                  >
                    <Ticket className="w-4 h-4" /> Inscrever-se
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Registration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="w-6 h-6" /> Inscrição no Evento
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium text-lg mt-1">
                {selectedEvent?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary-foreground/80">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedEvent?.date}</span>
              {selectedEvent?.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedEvent.location}</span>
              )}
              {selectedEvent?.organizerName && (
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {selectedEvent.organizerName}</span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8 pb-32">
            {isDuplicate && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">Já identificamos uma inscrição com este CPF.</p>
              </div>
            )}

            {/* Unified registration form configured by the organizer */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-primary" /> Formulário de inscrição
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Preencha os campos definidos pelo organizador para concluir sua inscrição.</p>
              </div>
              {unifiedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">O organizador ainda não configurou campos para este formulário.</p>
              ) : (
                <div className="grid gap-5">
                  {unifiedFields.map((field) => {
                    const Icon = field.kind === "standard" ? field.icon : ClipboardList;
                    const value = formValues[field.id];
                    const inputType = field.kind === "standard" ? field.inputType : field.type;
                    const placeholder = field.kind === "standard" ? field.placeholder : field.label;
                    const readOnly = field.kind === "standard" && field.readOnly;
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <Icon className="w-3 h-3" /> {field.label}{field.required ? " *" : ""}
                        </Label>
                        <Input
                          type={inputType || "text"}
                          placeholder={placeholder || ""}
                          className={`h-11 ${readOnly ? "bg-muted/30 cursor-not-allowed" : ""}`}
                          value={typeof value === "string" ? value : value ? String(value) : ""}
                          readOnly={readOnly}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          maxLength={200}
                        />
                        {field.kind === "standard" && field.helper && (
                          <p className="text-[10px] text-muted-foreground italic">{field.helper}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-4 space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Percent className="w-3 h-3" /> Cupom de desconto
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); if (!e.target.value) setCouponDiscount(null); }}
                className="h-10 font-mono uppercase"
                maxLength={20}
              />
              <Button variant="outline" size="sm" className="h-10 px-4 shrink-0" onClick={validateCoupon} disabled={!couponCode.trim()}>
                Aplicar
              </Button>
            </div>
            {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            {couponDiscount && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Cupom "{couponDiscount.codigo}" aplicado —{" "}
                {couponDiscount.modo === "percentual" ? `${couponDiscount.valor}% de desconto` : `R$ ${couponDiscount.valor} de desconto`}
              </p>
            )}
          </div>

          {selectedTicket && (
            <div className="px-6 pb-4">
              <ChargeSummary
                subtotalCents={selectedCharge.subtotal}
                taxaCents={selectedCharge.taxa}
                totalCents={selectedCharge.total}
                taxaPercent={selectedPriceCents > 0 ? taxaPercent : undefined}
              />
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-card border-t p-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button disabled={!isFormValid} onClick={handleRegister} className="gap-2">
              <Ticket className="w-4 h-4" /> Confirmar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {checkout && selectedEvent?.id && (
        <CheckoutModal
          eventId={selectedEvent.id}
          ticketId={checkout.ticketId}
          ticketName={checkout.name}
          quantity={checkout.quantity}
          couponCode={checkout.coupon}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
};

export default ExploreEventsPage;
