import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Calendar, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockEvents = [
  { id: 1, name: "Retiro de Quaresma", date: "28 Mar 2026", location: "Paróquia São José", type: "Presencial", attendees: 120, status: "Ativo" },
  { id: 2, name: "Missa Solene de Páscoa", date: "05 Abr 2026", location: "Catedral Central", type: "Híbrido", attendees: 350, status: "Ativo" },
  { id: 3, name: "Encontro de Jovens", date: "12 Abr 2026", location: "Centro Pastoral", type: "Presencial", attendees: 85, status: "Rascunho" },
  { id: 4, name: "Live de Oração", date: "18 Abr 2026", location: "Online", type: "Online", attendees: 200, status: "Ativo" },
];

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState(mockEvents);
  const navigate = useNavigate();

  useEffect(() => {
    // Carrega eventos salvos no localStorage
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (storedEvents.length > 0) {
        // Combina mockEvents com storedEvents (evitando duplicatas se o ID bater, embora IDs de mock sejam fixos pequenos)
        setEvents([...storedEvents, ...mockEvents]);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos locais:", error);
    }
  }, []);

  const filtered = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guardião Eventos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os seus eventos</p>
        </div>
        <Button onClick={() => navigate("/events/new")} className="gap-2 bg-[#007600] hover:bg-[#006000]">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar eventos..." className="pl-10 focus-visible:ring-[#007600]" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((event) => (
          <Card key={event.id} className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-[#007600]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  event.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {event.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007600]/10 text-[#007600] font-bold uppercase tracking-wider">
                  {event.type}
                </span>
              </div>
              <h3 className="font-bold text-card-foreground group-hover:text-[#007600] transition-colors leading-tight">{event.name}</h3>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#007600]" />{event.date}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#007600]" />{event.location}</div>
                <div className="flex items-center gap-2 font-medium text-foreground/70"><Users className="w-3.5 h-3.5 text-[#007600]" />{event.attendees} inscritos</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
          <p className="text-muted-foreground">Nenhum evento encontrado com os termos de busca.</p>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
