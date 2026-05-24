import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { syncCustomEvents } from "@/lib/events-sync";
import {
  Search, Calendar, MapPin, Users, ChevronRight, ChevronLeft,
  Music, BookOpen, Tent, Mountain, Heart, Star, Mic2, Sparkles,
  Menu, X, Ticket, ArrowRight, ChevronDown, ChevronUp,
  Building2, Mail, Instagram, Facebook, Youtube, Phone,
} from "lucide-react";

const CATEGORIES = [
  { key: "shows", label: "Shows Católicos", icon: Music, color: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "congressos", label: "Congressos e Seminários", icon: Mic2, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "retiros", label: "Retiros", icon: Mountain, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "acampamentos", label: "Acampamentos", icon: Tent, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "cursos", label: "Cursos e Workshops", icon: BookOpen, color: "bg-rose-50 text-rose-700 border-rose-200" },
  { key: "encontros", label: "Encontros de Formação", icon: Heart, color: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "espiritualidade", label: "Encontros de Espiritualidade", icon: Sparkles, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "palestras", label: "Palestras", icon: Star, color: "bg-orange-50 text-orange-700 border-orange-200" },
  { key: "catequese", label: "Catequese", icon: BookOpen, color: "bg-teal-50 text-teal-700 border-teal-200" },
];

const FAQS = [
  { q: "Como faço para me inscrever em um evento?", a: "Navegue até a página do evento desejado, clique em 'Inscrever-se', preencha o formulário com seus dados e conclua o processo de inscrição. Você receberá uma confirmação por e-mail e WhatsApp." },
  { q: "Posso transferir meu ingresso para outra pessoa?", a: "Sim, em eventos que permitem transferência você pode editar os dados do participante diretamente na plataforma até 24h antes do início do evento." },
  { q: "Meu pagamento foi confirmado, mas não recebi o ingresso. O que fazer?", a: "Verifique sua caixa de spam. Caso não encontre, acesse 'Meus Ingressos' na plataforma — seu comprovante estará disponível lá. Em caso de dúvidas, entre em contato com nosso suporte." },
  { q: "Como faço para cancelar minha inscrição e solicitar reembolso?", a: "Acesse 'Meus Ingressos', selecione o evento e clique em 'Solicitar cancelamento'. O reembolso é garantido em até 7 dias após a compra, conforme o Código de Defesa do Consumidor." },
  { q: "Sou organizador. Como faço para cadastrar meu evento?", a: "Crie uma conta, acesse o painel do organizador, clique em 'Criar evento' e siga os passos: informações gerais, página do evento, ingressos, pagamento e formulário de inscrição." },
  { q: "A maior plataforma também processa eventos pagos?", a: "Sim. Para eventos gratuitos, não cobramos nada. Para eventos pagos, aplicamos uma taxa de 7,3% por inscrição, sem mensalidades ou taxas de cadastro." },
];

const GRADIENT_PLACEHOLDERS = [
  "from-emerald-400 to-teal-600",
  "from-purple-400 to-indigo-600",
  "from-amber-400 to-orange-600",
  "from-rose-400 to-pink-600",
  "from-blue-400 to-cyan-600",
  "from-green-400 to-emerald-600",
  "from-violet-400 to-purple-600",
  "from-orange-400 to-red-600",
];

const formatPrice = (tickets: any[]): string => {
  if (!tickets?.length) return "Gratuito";
  const prices = tickets.map((t) => Number(t.price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === 0 && max === 0) return "Gratuito";
  if (min === max) return `R$ ${min.toFixed(2).replace(".", ",")}`;
  return `A partir de R$ ${min.toFixed(2).replace(".", ",")}`;
};

const EventCard = ({ event, index, onClick }: { event: any; index: number; onClick: () => void }) => {
  const tickets = event.tickets || event.details?.tickets || [];
  const price = formatPrice(tickets);
  const gradient = GRADIENT_PLACEHOLDERS[index % GRADIENT_PLACEHOLDERS.length];

  return (
    <div
      onClick={onClick}
      className="group flex-shrink-0 w-64 md:w-72 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className={`h-36 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white/50" />
          </div>
        )}
        {event.category && (
          <span className="absolute top-2 left-2 bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#004d00] px-2 py-0.5 rounded-full">
            {CATEGORIES.find(c => c.key === event.category)?.label || event.category}
          </span>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-[#004d00] transition-colors min-h-[2.5rem]">
          {event.name}
        </h3>
        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#004d00] shrink-0" /> {event.date}</div>
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#004d00] shrink-0" /><span className="truncate">{event.location || "Local a definir"}</span></div>
          {event.organizerName && (
            <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#004d00] shrink-0" /><span className="truncate">{event.organizerName}</span></div>
          )}
        </div>
        <div className="pt-1 flex items-center justify-between">
          <span className={`text-xs font-bold ${price === "Gratuito" ? "text-emerald-600" : "text-[#004d00]"}`}>{price}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Users className="w-3 h-3" /> {event.attendees || 0}</span>
        </div>
      </div>
    </div>
  );
};

const EventCardGrid = ({ event, index, onClick }: { event: any; index: number; onClick: () => void }) => {
  const tickets = event.tickets || event.details?.tickets || [];
  const price = formatPrice(tickets);
  const gradient = GRADIENT_PLACEHOLDERS[index % GRADIENT_PLACEHOLDERS.length];

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className={`h-40 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white/50" />
          </div>
        )}
        {event.category && (
          <span className="absolute top-2 left-2 bg-white/90 text-[10px] font-bold uppercase tracking-wider text-[#004d00] px-2 py-0.5 rounded-full">
            {CATEGORIES.find(c => c.key === event.category)?.label || event.category}
          </span>
        )}
        <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
          event.status === "Ativo" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
        }`}>{event.status}</span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-[#004d00] transition-colors min-h-[2.5rem]">
          {event.name}
        </h3>
        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#004d00] shrink-0" />{event.date}</div>
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#004d00] shrink-0" /><span className="truncate">{event.location || "Local a definir"}</span></div>
        </div>
        <div className="pt-1 flex items-center justify-between border-t border-slate-50">
          <span className={`text-xs font-bold ${price === "Gratuito" ? "text-emerald-600" : "text-[#004d00]"}`}>{price}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" />{event.attendees || 0} inscritos</span>
        </div>
      </div>
    </div>
  );
};

const HorizontalScroll = ({ events, onEventClick }: { events: any[]; onEventClick: (e: any) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };
  if (!events.length) return <p className="text-sm text-slate-400 py-6 text-center">Nenhum evento disponível nesta categoria.</p>;
  return (
    <div className="relative">
      <button onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:border-[#004d00] transition hidden md:flex">
        <ChevronLeft className="w-4 h-4 text-slate-600" />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
        {events.map((ev, i) => (
          <EventCard key={ev.id} event={ev} index={i} onClick={() => onEventClick(ev)} />
        ))}
      </div>
      <button onClick={() => scroll("right")} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center hover:border-[#004d00] transition hidden md:flex">
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </button>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [registrations, setRegistrations] = useState(0);

  useEffect(() => {
    try {
      setEvents(syncCustomEvents());
      setRegistrations(JSON.parse(localStorage.getItem("event_registrations") || "[]").length);
    } catch {
      setEvents([]);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/participante/explorar${search ? `?q=${encodeURIComponent(search)}` : ""}`);
  };

  const handleEventClick = (ev: any) => {
    navigate(`/evento/${ev.slug || ev.id}`);
  };

  const handleCategoryClick = (cat: string) => {
    navigate("/participante/explorar");
  };

  const trending = events.filter((e) => e.status === "Ativo").slice(0, 8);
  const allEvents = events.filter((e) => e.status === "Ativo").slice(0, 8);

  const byCategory = (cat: string) => events.filter((e) => e.category === cat && e.status === "Ativo").slice(0, 6);

  const CATEGORY_SECTIONS = [
    "retiros", "congressos", "acampamentos", "shows", "cursos", "encontros", "espiritualidade",
  ].filter((cat) => byCategory(cat).length > 0);

  const statsEvents = events.length;
  const statsRegistrations = registrations;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#004d00] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#004d00] text-sm hidden sm:block">Guardião Eventos</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button onClick={() => navigate("/participante/explorar")} className="hover:text-[#004d00] transition-colors">Eventos</button>
            <button onClick={() => navigate("/participante/explorar")} className="hover:text-[#004d00] transition-colors">Categorias</button>
            <button onClick={() => navigate("/planos")} className="hover:text-[#004d00] transition-colors">Para Organizadores</button>
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar eventos..."
                className="pl-9 h-9 text-sm border-slate-200 focus-visible:ring-[#004d00]/30"
              />
            </div>
          </form>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-[#004d00]" onClick={() => navigate("/login")}>
              <Ticket className="w-4 h-4 mr-1" /> Meus Ingressos
            </Button>
            <Button variant="outline" size="sm" className="border-slate-200 text-slate-700" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4" onClick={() => navigate("/login")}>
              Criar Seu Evento
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen((v) => !v)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar eventos..." className="flex-1 h-9 text-sm" />
              <Button size="sm" type="submit" className="bg-[#004d00] text-white">Buscar</Button>
            </form>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>Entrar</Button>
              <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}>Criar Evento</Button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-[#0b3d2e] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center space-y-6">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-700/40">
            Plataforma de Eventos Católicos
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight max-w-4xl mx-auto">
            A Maior Plataforma de{" "}
            <span className="text-amber-400">Eventos Católicos</span>{" "}
            do Brasil
          </h1>
          <p className="text-base md:text-lg text-emerald-100/80 max-w-2xl mx-auto">
            Crie, divulgue e gerencie seus eventos católicos com facilidade. Retiros, shows, congressos, acampamentos e muito mais em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-900/30"
              onClick={() => navigate("/login")}
            >
              Criar Seu Evento
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-white/30 text-white hover:bg-white/10 font-semibold"
              onClick={() => navigate("/participante/explorar")}
            >
              Explorar Eventos
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative max-w-3xl mx-auto px-4 md:px-6 pb-0 -mb-6">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center gap-2 p-2">
            <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome do evento, localidade ou categoria..."
              className="flex-1 border-none shadow-none focus-visible:ring-0 text-sm"
            />
            <Button type="submit" className="bg-[#004d00] hover:bg-[#003300] text-white h-10 px-6 rounded-xl font-semibold shrink-0">
              Buscar
            </Button>
          </form>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-8 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Explore por Categoria</h2>
          <p className="text-sm text-slate-500">Encontre o evento perfeito para você</p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center hover:scale-105 transition-all ${cat.color}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center">
                <cat.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── EVENTOS EM ALTA ── */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Eventos em alta</h2>
            <p className="text-sm text-slate-500">Os eventos mais procurados agora</p>
          </div>
          <button
            onClick={() => navigate("/participante/explorar")}
            className="text-sm font-semibold text-[#004d00] hover:underline flex items-center gap-1"
          >
            Ver mais <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {trending.length > 0 ? (
          <HorizontalScroll events={trending} onEventClick={handleEventClick} />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-medium">Nenhum evento disponível ainda.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>Criar o primeiro evento</Button>
          </div>
        )}
      </section>

      {/* ── TODOS OS EVENTOS ── */}
      {allEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Todos os Eventos</h2>
            <button
              onClick={() => navigate("/participante/explorar")}
              className="text-sm font-semibold text-[#004d00] hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allEvents.map((ev, i) => (
              <EventCardGrid key={ev.id} event={ev} index={i} onClick={() => handleEventClick(ev)} />
            ))}
          </div>
          <div className="flex justify-center pt-4">
            <Button variant="outline" className="border-[#004d00] text-[#004d00] hover:bg-[#004d00]/5 px-8" onClick={() => navigate("/participante/explorar")}>
              Ver todos os eventos <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      )}

      {/* ── CATEGORY SECTIONS ── */}
      {CATEGORY_SECTIONS.map((cat) => {
        const catInfo = CATEGORIES.find((c) => c.key === cat);
        const catEvents = byCategory(cat);
        if (!catInfo || !catEvents.length) return null;
        return (
          <section key={cat} className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${catInfo.color}`}>
                  <catInfo.icon className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{catInfo.label}</h2>
                <span className="text-xs text-slate-400">({catEvents.length}+ eventos)</span>
              </div>
              <button
                onClick={() => navigate("/participante/explorar")}
                className="text-sm font-semibold text-[#004d00] hover:underline flex items-center gap-1"
              >
                Ver mais <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <HorizontalScroll events={catEvents} onEventClick={handleEventClick} />
          </section>
        );
      })}

      {/* ── STATS ── */}
      <section className="bg-[#0b3d2e] py-16 mt-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: `${statsEvents}+`, label: "Eventos Realizados" },
              { value: `${Math.max(statsRegistrations, 0)} mil+`, label: "Inscrições Realizadas" },
              { value: "0 mil+", label: "Checkins Realizados" },
              { value: "0+", label: "Cursos" },
            ].map((s) => (
              <div key={s.label} className="space-y-2">
                <p className="text-3xl md:text-4xl font-black text-amber-400">{s.value}</p>
                <p className="text-sm text-emerald-100/70 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#004d00]">Dúvidas</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Perguntas Frequentes</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-600 border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-sm text-slate-500">
          Outras dúvidas?{" "}
          <button onClick={() => navigate("/support")} className="text-[#004d00] font-semibold hover:underline">
            Acesse nossa Central de Ajuda
          </button>
        </div>
      </section>

      {/* ── ORGANIZER CTA ── */}
      <section className="bg-gradient-to-br from-[#0b3d2e] to-[#004d00] py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">
            Organize seu evento na maior plataforma de{" "}
            <span className="text-amber-400">Eventos Católicos</span> do Brasil
          </h2>
          <p className="text-emerald-100/80 text-base max-w-xl mx-auto">
            Crie sua conta gratuitamente e comece a organizar seus eventos em minutos. Sem mensalidade, sem cartão.
          </p>
          <Button
            size="lg"
            className="h-12 px-10 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xl"
            onClick={() => navigate("/login")}
          >
            Criar Seu Evento
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#004d00] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Guardião Eventos</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                A plataforma de eventos para a comunidade católica do Brasil.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="https://facebook.com/guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-400 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="https://youtube.com/@guardiaoeventos" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-slate-400 hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
              </div>
            </div>

            {/* Eventos */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Eventos</h4>
              <ul className="space-y-2 text-sm">
                {["Todos os Eventos", "Retiros", "Congressos e Seminários", "Acampamentos", "Shows Católicos"].map((l) => (
                  <li key={l}><button onClick={() => navigate("/participante/explorar")} className="hover:text-white transition-colors">{l}</button></li>
                ))}
              </ul>
            </div>

            {/* Organizadores */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Para Organizadores</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: "Criar Evento", route: "/login" },
                  { label: "Planos e Preços", route: "/planos" },
                  { label: "Painel do Organizador", route: "/login" },
                  { label: "Central de Ajuda", route: "/support" },
                ].map((l) => (
                  <li key={l.label}><button onClick={() => navigate(l.route)} className="hover:text-white transition-colors">{l.label}</button></li>
                ))}
              </ul>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Contato</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#004d00] shrink-0" /> contato@guardiaeventos.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#004d00] shrink-0" /> (00) 0000-0000</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© 2026 Guardião Eventos. Todos os direitos reservados.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-white transition-colors">Termos de Uso</button>
              <button className="hover:text-white transition-colors">Privacidade</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
