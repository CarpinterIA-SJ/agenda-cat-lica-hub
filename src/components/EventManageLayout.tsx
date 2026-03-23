import { useState } from "react";
import { Outlet, useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  DollarSign, 
  UserPlus, 
  Share2, 
  Settings, 
  CheckCircle2,
  ArrowLeft,
  Info,
  Globe,
  CreditCard,
  FileText,
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Gerenciar Ingressos", icon: Ticket, id: "tickets-manage" },
  { title: "Participantes", icon: Users, id: "participants" },
  { title: "Financeiro", icon: DollarSign, id: "financial" },
  { title: "Colaboradores", icon: UserPlus, id: "collaborators" },
  { title: "Integração", icon: Share2, id: "integrations" },
  { title: "Configurações", icon: Settings, id: "settings" },
  { title: "Check-ins", icon: CheckCircle2, id: "checkins" },
];

const tabItems = [
  { title: "Informações gerais", icon: Info, id: "general" },
  { title: "Página do evento", icon: Globe, id: "page" },
  { title: "Ingressos", icon: Ticket, id: "tickets" },
  { title: "Pagamento", icon: CreditCard, id: "payment" },
  { title: "Formulário de inscrição", icon: FileText, id: "form" },
  { title: "Mensagens", icon: MessageSquare, id: "messages" },
];

const EventManageLayout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mock event data - in a real app this would be fetched based on 'id'
  const eventName = "Retiro de Quaresma 2026";
  const eventDate = "28 de Março, 2026 • 08:00 - 18:00";

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
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all group",
                  item.id === "dashboard" 
                    ? "bg-primary/5 text-primary border border-primary/10" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 shrink-0",
                  item.id === "dashboard" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventManageLayout;
