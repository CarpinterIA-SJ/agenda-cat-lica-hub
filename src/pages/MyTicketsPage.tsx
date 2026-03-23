import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Calendar, MapPin, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TicketItem {
  id: number;
  eventId: number;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketName: string;
  status: string;
}

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const registrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
      const allEvents = [
        ...JSON.parse(localStorage.getItem("custom_events") || "[]"),
        { id: 1, name: "Retiro de Quaresma", date: "28 Mar 2026", location: "Paróquia São José" },
      ];

      const mapped: TicketItem[] = registrations.map((reg: any) => {
        const ev = allEvents.find((e: any) => String(e.id) === String(reg.eventId));
        return {
          id: reg.id,
          eventId: reg.eventId,
          eventName: ev?.name || "Evento",
          eventDate: ev?.date || ev?.start_date || "",
          eventLocation: ev?.location || "",
          ticketName: reg.ticketId || "Ingresso",
          status: "Confirmado",
        };
      });
      setTickets(mapped);
    } catch {
      setTickets([]);
    }
  }, []);

  const filtered = tickets.filter((t) =>
    t.eventName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Ingressos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe os ingressos dos eventos que você participou ou vai participar.</p>
        </div>
        <Button onClick={() => navigate("/participante/explorar")} className="gap-2">
          <Search className="w-4 h-4" />
          Explorar Eventos
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Ticket className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum ingresso encontrado</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Os ingressos adquiridos aparecerão aqui. Explore os eventos disponíveis e inscreva-se!
            </p>
            <Button onClick={() => navigate("/participante/explorar")} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              Explorar Eventos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ingressos..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ticket) => (
              <Card key={ticket.id} className="shadow-card hover:shadow-card-hover transition-all border-l-4 border-l-primary">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-card-foreground">{ticket.eventName}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                      {ticket.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {ticket.eventDate}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="truncate">{ticket.eventLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary" />
                      {ticket.ticketName}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyTicketsPage;
