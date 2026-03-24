import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  DollarSign, 
  Share2, 
  Settings, 
  CheckCircle2,
  ArrowLeft,
  Info,
  Globe,
  CreditCard,
  FileText,
  MessageSquare,
  ClipboardList,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventDetailsTab } from "@/components/event-dashboard/EventDetailsTab";
import { EventPageTab } from "@/components/event-dashboard/EventPageTab";
import { EventTicketsTab } from "@/components/event-dashboard/EventTicketsTab";
import { EventPaymentTab } from "@/components/event-dashboard/EventPaymentTab";
import { EventFormTab } from "@/components/event-dashboard/EventFormTab";
import { EventMessagesTab } from "@/components/event-dashboard/EventMessagesTab";

const sidebarItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Gerenciar Ingressos", icon: Ticket, id: "tickets-manage" },
  { title: "Participantes", icon: Users, id: "participants" },
  { title: "Financeiro", icon: DollarSign, id: "financial" },
  { title: "Integração", icon: Share2, id: "integrations" },
  { title: "Configurações", icon: Settings, id: "settings" },
  { title: "Check-ins", icon: CheckCircle2, id: "checkins" },
];

const tabItems = [
  { title: "Informações gerais", icon: Info, id: "general" },
  { title: "Página do evento", icon: Globe, id: "page" },
  { title: "Ingressos", icon: Ticket, id: "tickets" },
  { title: "Pagamento", icon: CreditCard, id: "payment" },
  { title: "Formulário de inscrição", icon: ClipboardList, id: "form" },
  { title: "Mensagens", icon: MessageSquare, id: "messages" },
];

const EventManageLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [activeSidebar, setActiveSidebar] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load event data from localStorage or use mock
  const getEvent = () => {
    try {
      const stored = localStorage.getItem("created_events");
      if (stored) {
        const events = JSON.parse(stored);
        const found = events.find((e: any) => String(e.id) === String(id));
        if (found) return found;
      }
    } catch {}
    return {
      id,
      name: "Retiro de Quaresma 2026",
      date: "28 de Março, 2026 • 08:00 - 18:00",
      status: "Publicado",
      tickets: [],
    };
  };

  const event = getEvent();
  const eventName = event.name || "Evento";
  const eventDate = event.date || "Data não definida";

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <EventDetailsTab event={event} />;
      case "page":
        return <EventPageTab />;
      case "tickets":
        return <EventTicketsTab event={event} />;
      case "payment":
        return <EventPaymentTab />;
      case "form":
        return <EventFormTab />;
      case "messages":
        return <EventMessagesTab />;
      default:
        return <EventDetailsTab event={event} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{eventName}</h1>
            <p className="text-xs font-medium text-slate-500">{eventDate}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/organizador/dashboard")}
          className="gap-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl px-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar para os meus eventos</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={cn(
          "w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-20 left-0 z-20 transition-transform lg:static",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0 lg:w-20"
        )}>
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSidebar(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group",
                  activeSidebar === item.id 
                    ? "bg-primary/5 text-primary border border-primary/10" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0",
                  activeSidebar === item.id ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                )} />
                {isSidebarOpen && <span>{item.title}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Tabs */}
          <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-8 min-w-max">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-4 text-sm font-bold transition-all relative border-b-2",
                    activeTab === tab.id 
                      ? "text-primary border-primary" 
                      : "text-slate-400 border-transparent hover:text-slate-600"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#F8FAFC]">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventManageLayout;
