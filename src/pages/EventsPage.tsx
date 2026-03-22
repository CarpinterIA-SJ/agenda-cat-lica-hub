import { useState } from "react";
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
  const navigate = useNavigate();
  const filtered = mockEvents.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Católica</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os seus eventos</p>
        </div>
        <Button onClick={() => navigate("/events/new")} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Evento
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar eventos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((event) => (
          <Card key={event.id} className="shadow-card hover:shadow-card-hover transition-all cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  event.status === "Ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>
                  {event.status}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {event.type}
                </span>
              </div>
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{event.name}</h3>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{event.date}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{event.location}</div>
                <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{event.attendees} inscritos</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
