import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, Calendar, MapPin, Users, ChevronRight, Eye, EyeOff,
} from "lucide-react";

const mockEvents = [
  {
    id: 1,
    name: "Retiro de Quaresma",
    date: "28 Mar 2026",
    start_date: "2026-03-28T08:00",
    location: "Paróquia São José",
    type: "Presencial",
    attendees: 120,
    status: "Publicado",
  },
];

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
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
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => {
      if (filter === "upcoming") return e.status === "Publicado" || e.status === "Ativo";
      if (filter === "finished") return e.status === "Finalizado";
      return true;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Eventos</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus eventos e acompanhe as inscrições</p>
        </div>
        <Button onClick={() => navigate("/events/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          Criar novo evento
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Tabs value={filter} onValueChange={setFilter} className="w-auto">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos eventos</TabsTrigger>
            <TabsTrigger value="finished">Eventos finalizados</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar eventos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum evento encontrado</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Crie seu primeiro evento e comece a gerenciar inscrições.
            </p>
            <Button onClick={() => navigate("/events/new")} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar novo evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <Card key={event.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-all group border-l-4 border-l-transparent hover:border-l-primary overflow-hidden bg-card">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      event.status === "Publicado" || event.status === "Ativo"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {event.status === "Ativo" ? "Publicado" : event.status || "Rascunho"}
                    </span>
                    {event.status === "Publicado" || event.status === "Ativo" ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors mb-4 line-clamp-2 min-h-[3.5rem]">
                    {event.name}
                  </h3>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" /> {event.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground/70">
                      <Users className="w-4 h-4 text-primary" /> {event.attendees || 0} inscritos
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-muted/30 border-t mt-auto">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/events/dashboard/${event.id}`)}
                    className="w-full gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5"
                  >
                    <ChevronRight className="w-4 h-4" /> Gerenciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerEventsPage;
