import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Calendar,
  Eye,
  LayoutGrid,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const mockEvents = [
  {
    id: 1,
    name: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE",
    date: "21 a 22 de outubro de 2026",
    type: "Evento Online",
    organizer: "Fabrício Cavalcante",
    status: "Publicado",
  },
];

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [events, setEvents] = useState<any[]>(mockEvents);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (stored.length > 0) {
        setEvents([...stored, ...mockEvents]);
      }
    } catch {
      // ignore
    }
  }, []);

  const filtered = events
    .filter((e) => (e.name || "").toLowerCase().includes(search.toLowerCase()))
    .filter((e) => {
      if (filter === "upcoming") return e.status === "Publicado" || e.status === "Ativo";
      if (filter === "finished") return e.status === "Finalizado";
      return true;
    });

  const totalPages = 1;

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
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary">
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary">
              <Moon className="w-5 h-5" />
            </Button>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center">
              GE
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Meus eventos</h1>
          <Button onClick={() => navigate("/events/new")} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Criar novo evento
          </Button>
        </div>

        <div className="space-y-4">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="bg-transparent p-0 h-auto gap-6">
              <TabsTrigger
                value="upcoming"
                className="px-0 pb-2 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Próximos eventos
              </TabsTrigger>
              <TabsTrigger
                value="finished"
                className="px-0 pb-2 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Eventos finalizados
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="px-0 pb-2 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              className="pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-5">
                <Calendar className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum evento encontrado</h3>
              <p className="text-slate-500 max-w-sm mb-6">Crie seu primeiro evento para começar.</p>
              <Button onClick={() => navigate("/events/new")} className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Criar novo evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((event) => (
              <Card key={event.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="h-28 bg-primary/90 flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div className="p-5 space-y-3">
                    <span className="text-xs text-orange-500 font-semibold">
                      {event.date || "Data não definida"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase line-clamp-2 min-h-[2.5rem]">
                      {event.name}
                    </h3>
                    <div className="text-sm text-slate-500 space-y-1">
                      <p>{event.type || "Evento Online"}</p>
                      <p>Organizado por: {event.organizer || "Equipe Guardião"}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {event.status === "Ativo" ? "Publicado" : event.status || "Publicado"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="border border-slate-200 text-slate-500 hover:text-primary"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary"
                          onClick={() => navigate(`/events/dashboard/${event.id}`)}
                        >
                          Gerenciar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">Exibindo 1 de {totalPages} páginas</span>
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
    </div>
  );
};

export default OrganizerEventsPage;
