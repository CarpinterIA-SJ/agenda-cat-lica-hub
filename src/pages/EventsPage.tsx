import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Settings,
  MoreHorizontal,
  ChevronRight,
  Filter,
  Trash2,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const mockEvents = [
  { 
    id: 1, 
    name: "Retiro de Quaresma", 
    date: "28 Mar 2026", 
    location: "Paróquia São José", 
    attendees: 120, 
    status: "Publicado",
    isFinished: false
  },
  { 
    id: 2, 
    name: "Congresso de Jovens 2024", 
    date: "15 Fev 2024", 
    location: "Centro de Eventos", 
    attendees: 450, 
    status: "Finalizado",
    isFinished: true
  },
  { 
    id: 3, 
    name: "Workshop de Liderança", 
    date: "10 Abr 2026", 
    location: "Auditório Central", 
    attendees: 0, 
    status: "Rascunho",
    isFinished: false
  },
];

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState<any[]>(mockEvents);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (storedEvents.length > 0) {
        setEvents([...mockEvents, ...storedEvents]);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos locais:", error);
    }
  }, []);

  const handleDeleteEvent = (id: number) => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      const updatedStored = storedEvents.filter((e: any) => e.id !== id);
      localStorage.setItem("custom_events", JSON.stringify(updatedStored));
      
      setEvents(events.filter(e => e.id !== id));
      toast.success("Evento excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir evento.");
    }
  };

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const isFinished = e.isFinished || new Date(e.date) < new Date();
      
      if (activeTab === "upcoming") return matchesSearch && !isFinished;
      if (activeTab === "finished") return matchesSearch && isFinished;
      return matchesSearch;
    });
  }, [events, search, activeTab]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Eventos</h1>
          <p className="text-slate-500">Crie, gerencie e acompanhe todos os seus eventos em tempo real.</p>
        </div>
        <Button 
          onClick={() => navigate("/events/new")} 
          className="gap-2 bg-primary hover:bg-primary/90 h-11 px-6 font-semibold shadow-lg shadow-primary/20 transition-all border-none"
        >
          <Plus className="w-5 h-5" />
          Criar novo evento
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <Tabs defaultValue="all" className="w-full lg:w-auto" onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100/80 p-1">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Próximos eventos</TabsTrigger>
            <TabsTrigger value="finished" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Eventos finalizados</TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">Todos</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full lg:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 font-bold" />
            <Input 
              placeholder="Pesquisar por nome do evento..." 
              className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 hover:bg-slate-50 shrink-0 shadow-sm">
            <Filter className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Nenhum evento encontrado</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Tente ajustar seus filtros ou pesquise por outro termo.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <Card key={event.id} className="group relative bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col rounded-2xl">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 flex-1 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      event.status === "Publicado" 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : event.status === "Rascunho"
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        event.status === "Publicado" ? "bg-emerald-500 animate-pulse" : event.status === "Rascunho" ? "bg-amber-500" : "bg-slate-400"
                      }`} />
                      {event.status}
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors leading-tight min-h-[3rem] line-clamp-2">
                      {event.name}
                    </h3>
                  </div>
                  
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      {event.date}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      {event.attendees || 0} inscritos registrados
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="flex-1 gap-2 font-bold border-slate-200 text-slate-700 hover:bg-white hover:border-primary hover:text-primary transition-all rounded-xl h-11"
                  >
                    <Eye className="w-4 h-4" /> Visualizar
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="gap-2 font-bold border-slate-200 text-slate-700 hover:bg-white hover:border-primary hover:text-primary transition-all rounded-xl h-11 px-3"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="gap-2 font-bold border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all rounded-xl h-11 px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
