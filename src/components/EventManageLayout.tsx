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
  MessageSquare,
  ClipboardList,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Clock,
  Tag,
  Receipt,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventDetailsTab } from "@/components/event-dashboard/EventDetailsTab";
import { EventPageTab } from "@/components/event-dashboard/EventPageTab";
import { EventTicketsTab } from "@/components/event-dashboard/EventTicketsTab";
import { EventPaymentTab } from "@/components/event-dashboard/EventPaymentTab";
import { EventFormTab } from "@/components/event-dashboard/EventFormTab";
import { EventMessagesTab } from "@/components/event-dashboard/EventMessagesTab";

interface SidebarChild {
  title: string;
  icon: any;
  tabId: string;
}

interface SidebarItem {
  title: string;
  icon: any;
  id: string;
  tabId?: string;
  children?: SidebarChild[];
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard", tabId: "general" },
  {
    title: "Gerenciar Ingressos", icon: Ticket, id: "tickets-manage",
    children: [
      { title: "Ingressos", icon: Ticket, tabId: "tickets" },
    ],
  },
  {
    title: "Participantes", icon: Users, id: "participants",
    children: [
      { title: "Lista de participantes", icon: ListOrdered, tabId: "participants-list" },
      { title: "Fila de espera", icon: Clock, tabId: "waitlist" },
    ],
  },
  {
    title: "Financeiro", icon: DollarSign, id: "financial",
    children: [
      { title: "Cupons de Desconto", icon: Tag, tabId: "coupons" },
      { title: "Histórico de Transações", icon: Receipt, tabId: "transactions" },
      { title: "Repasses", icon: Banknote, tabId: "transfers" },
    ],
  },
  { title: "Integração", icon: Share2, id: "integrations", tabId: "integrations" },
  {
    title: "Configurações", icon: Settings, id: "settings",
    children: [
      { title: "Informações gerais", icon: Info, tabId: "general" },
      { title: "Página do evento", icon: Globe, tabId: "page" },
      { title: "Pagamento", icon: CreditCard, tabId: "payment" },
      { title: "Formulário de inscrição", icon: ClipboardList, tabId: "form" },
      { title: "Mensagens", icon: MessageSquare, tabId: "messages" },
    ],
  },
  { title: "Check-ins", icon: CheckCircle2, id: "checkins", tabId: "checkins" },
];

const EventManageLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      case "participants-list":
        return <PlaceholderTab title="Lista de Participantes" />;
      case "waitlist":
        return <PlaceholderTab title="Fila de Espera" />;
      case "coupons":
        return <PlaceholderTab title="Cupons de Desconto" />;
      case "transactions":
        return <PlaceholderTab title="Histórico de Transações" />;
      case "transfers":
        return <PlaceholderTab title="Repasses" />;
      case "integrations":
        return <EventIntegrationsTab />;
      case "checkins":
        return <PlaceholderTab title="Check-ins" />;
      default:
        return <EventDetailsTab event={event} />;
    }
  };

  // Find which sidebar item (or child) is active
  const isChildActive = (item: SidebarItem) =>
    item.children?.some((c) => c.tabId === activeTab) ?? false;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-background border-b px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-foreground leading-tight">{eventName}</h1>
            <p className="text-xs font-medium text-muted-foreground">{eventDate}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/organizador/dashboard")}
          className="gap-2 font-semibold rounded-xl px-5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar para meus eventos</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-64 bg-background border-r flex flex-col fixed inset-y-16 left-0 z-20 transition-transform lg:static overflow-y-auto",
            !isSidebarOpen && "-translate-x-full lg:translate-x-0"
          )}
        >
          <nav className="flex-1 py-4 px-3 space-y-0.5">
            {sidebarItems.map((item) => {
              const hasChildren = !!item.children?.length;
              const isOpen = openGroups[item.id];
              const isActive = item.tabId === activeTab || isChildActive(item);

              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleGroup(item.id);
                      } else if (item.tabId) {
                        setActiveTab(item.tabId);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </span>
                    {hasChildren &&
                      (isOpen ? (
                        <ChevronUp className="w-4 h-4 opacity-50" />
                      ) : (
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      ))}
                  </button>

                  {hasChildren && isOpen && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-3">
                      {item.children!.map((child) => (
                        <button
                          key={child.tabId}
                          onClick={() => setActiveTab(child.tabId)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                            activeTab === child.tabId
                              ? "text-primary font-semibold bg-primary/5"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50 font-medium"
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{child.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-muted/30">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

const PlaceholderTab = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64 bg-background rounded-xl border">
    <p className="text-muted-foreground font-medium">{title} — Em breve</p>
  </div>
);

export default EventManageLayout;
