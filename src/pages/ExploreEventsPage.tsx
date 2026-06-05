import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Calendar, MapPin, Users, Ticket, Video, ArrowRight, Lock,
  Headset, MessageCircle, Tag, Building2, Eye, X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEvents } from "@/hooks/use-events";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EventRegistrationModal } from "@/components/EventRegistrationModal";
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
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [regOpen, setRegOpen] = useState(false);

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
  const eventTickets = eventData?.tickets || [];

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
                onClick={() => setRegOpen(true)}
              >
                Garantir minha inscrição
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

      {eventData?.id && (
        <EventRegistrationModal
          open={regOpen}
          onClose={() => setRegOpen(false)}
          event={eventData}
          tickets={eventTickets}
        />
      )}
    </div>
  );
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
  const navigate = useNavigate();

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
    setIsModalOpen(true);
  };

  const handleViewDetails = (event: any) => {
    const slug = event.slug || event.id;
    navigate(`/evento/${slug}`);
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
                  <div className="h-28 w-full bg-slate-100 flex items-center justify-center">
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

      {/* Modal de inscrição compartilhado (Explorar + página pública) */}
      <EventRegistrationModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        tickets={selectedEvent?.tickets ?? []}
      />
    </div>
  );
};

export default ExploreEventsPage;
