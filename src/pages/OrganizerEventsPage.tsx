import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Calendar,
  LayoutGrid,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Home,
  Users2,
  Headset,
  Ticket,
  Mail,
  Users,
  HelpCircle,
  LogOut,
  User,
  MessageCircle,
  MapPin,
} from "lucide-react";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const mockEvents = [
  {
    id: 1,
    title: "Retiro de Quaresma",
    status: "Ativo",
    format: "Presencial",
    date: "28 Mar 2026",
    location: "Paróquia São José",
    attendees: "120 inscritos",
  },
];

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [events] = useState<any[]>(mockEvents);
  const [eventSearch, setEventSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [eventOption, setEventOption] = useState("");
  const [tab, setTab] = useState("proximos");

  useEffect(() => {
    if (location.pathname.includes("meus-eventos")) {
      setTab("proximos");
    }
  }, [location.pathname]);

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  const appItems = [
    { label: "Home", icon: Home, route: "/organizador/home" },
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users2, route: "/crm/pessoas" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ].filter((item) => item.label.toLowerCase() !== "dizimo" && item.label.toLowerCase() !== "dízimo");

  const handleEventSave = () => {
    if (!eventOption) return;
    setEventDialogOpen(false);
    toast({ title: "Solicitação enviada", description: "Sua escolha foi registrada." });
    setEventOption("");
  };

  const handleViewEvent = (eventTitle: string) => {
    toast({ title: "Visualizar evento", description: `Abrindo ${eventTitle}.` });
  };

  const handleManageEvent = (eventTitle: string) => {
    toast({ title: "Gerenciar evento", description: `Gerenciando ${eventTitle}.` });
  };

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

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meus eventos</h1>
            <p className="text-sm text-slate-500">Acompanhe e gerencie seus eventos cadastrados.</p>
          </div>
          <Button onClick={() => setEventDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Criar novo evento
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-slate-200 w-full justify-start">
            <TabsTrigger
              value="proximos"
              className="px-0 pb-3 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Próximos eventos
            </TabsTrigger>
            <TabsTrigger
              value="finalizados"
              className="px-0 pb-3 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Eventos finalizados
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="px-0 pb-3 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Todos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Input
            placeholder="Buscar..."
            className="pr-10 bg-white"
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="border-slate-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {event.status}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {event.format}
                  </span>
                </div>
                <div className="space-y-3 text-left">
                  <h3 className="text-lg font-semibold text-slate-900 leading-6">{event.title}</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>{event.attendees}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100 pt-3">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => handleViewEvent(event.title)}
                  >
                    Visualizar
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleManageEvent(event.title)}
                  >
                    Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">Exibindo 0 de 1 páginas</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="border-primary text-primary">1</Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={eventOption} onValueChange={setEventOption}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Registrar um novo evento</SelectItem>
                <SelectItem value="vincular">Vincular a um novo evento da plataforma Guardião Eventos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEventSave} disabled={!eventOption}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default OrganizerEventsPage;
