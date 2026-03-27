import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  LayoutGrid,
  Moon,
  Sun,
  Home,
  Users2,
  HandHeart,
  HeartCrack,
  Headset,
  Ticket,
  Mail,
  Users,
  HelpCircle,
  LogOut,
  User,
  Heart,
  CalendarDays,
  MessageCircle,
} from "lucide-react";

const DashboardPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [eventCount, setEventCount] = useState(1);
  const [registrationCount, setRegistrationCount] = useState(0);

  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      setEventCount(storedEvents.length + 1);
    } catch {
      setEventCount(1);
    }
    try {
      const storedRegistrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
      setRegistrationCount(storedRegistrations.length);
    } catch {
      setRegistrationCount(0);
    }
  }, []);

  if (role === "participant") {
    return <Navigate to="/participante/meus-ingressos" replace />;
  }

  if (role !== "organizer") {
    return <Navigate to="/role-select" replace />;
  }

  if (location.pathname === "/dashboard") {
    return <Navigate to="/organizador/home" replace />;
  }

  const appItems = [
    { label: "Home", icon: Home, route: "/organizador/home" },
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users2, route: "/crm" },
    
    { label: "Atendimento", icon: Headset, route: "/support" },
  ];

  const stats = [
    { label: "Total de eventos", value: eventCount, icon: Calendar, color: "text-primary" },
    { label: "Total de campanhas de doações", value: 0, icon: Heart, color: "text-orange-500" },
    { label: "Total de contatos no CRM", value: 5, icon: Users, color: "text-blue-500" },
    { label: "Total de inscrições em eventos", value: registrationCount, icon: Ticket, color: "text-orange-500" },
    { label: "Total de doadores cadastrados", value: 0, icon: HandHeart, color: "text-orange-500" },
    { label: "Conta ativa desde", value: "17/01/2026", icon: CalendarDays, color: "text-blue-500" },
  ];

  const quickAccess = [
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users, route: "/crm" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-slate-900">Guardião Eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary">
                  <LayoutGrid className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 border-gray-100 shadow-sm">
                <div className="text-sm font-semibold text-slate-900 mb-3">Aplicações</div>
                <div className="grid grid-cols-2 gap-3">
                  {appItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.route)}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600 hover:text-primary"
                    onClick={() => setIsDark((prev) => !prev)}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alterar tema</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">FC</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-gray-100 shadow-sm">
                <DropdownMenuLabel className="font-normal text-[11px] text-slate-400">
                  fabricio.christian@gmail.com
                </DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <LayoutGrid className="w-4 h-4" />
                  Ver aplicações
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Minha conta
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Ticket className="w-4 h-4" />
                  Meus ingressos
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Convites pendentes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Organizadores
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Olá, Seja bem-vindo(a) ao painel Guardião Eventos!
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center">
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                <p className="text-lg font-bold text-slate-900">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Acesso rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickAccess.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center gap-3 text-center hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <a
        href="https://wa.me/5500000000000"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );
};

export default DashboardPage;
