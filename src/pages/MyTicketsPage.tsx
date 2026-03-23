import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Search, Calendar, MapPin, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(true);
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
          id: reg.id || Math.random(),
          eventId: reg.eventId,
          eventName: ev?.name || `Evento #${reg.eventId}`,
          eventDate: ev?.date || ev?.start_date || "Data a confirmar",
          eventLocation: ev?.location || "Local a confirmar",
          ticketName: reg.ticketId || "Ingresso",
          status: "Confirmado",
        };
      });
      setTickets(mapped);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = tickets.filter((t) =>
    t.eventName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meus Ingressos</h1>
          <p className="text-slate-500 mt-1">Veja todos os seus ingressos e inscrições em um só lugar.</p>
        </div>
        <Button 
          onClick={() => navigate("/dashboard")} 
          className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Search className="w-4 h-4" />
          Explorar Eventos
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ingressos..."
          className="pl-10 h-11 bg-white border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
              <Ticket className="w-10 h-10 text-slate-300" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-xl font-semibold text-slate-900">Nenhum ingresso encontrado</h3>
              <p className="text-slate-500">
                Os ingressos adquiridos aparecerão aqui. Comece explorando os eventos disponíveis na plataforma.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="mt-4 border-slate-200 hover:bg-white hover:border-primary hover:text-primary transition-all h-11 px-8 rounded-xl font-bold"
            >
              Explorar Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-none shadow-sm group">
              <div className="h-3 bg-primary" />
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      {ticket.status}
                    </span>
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors leading-tight">
                      {ticket.eventName}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shadow-sm">
                    <ExternalLink className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary/70" />
                    </div>
                    {ticket.eventDate}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary/70" />
                    </div>
                    <span className="truncate">{ticket.eventLocation}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4 text-primary/70" />
                    </div>
                    {ticket.ticketName}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-400 font-medium">
                    ID: <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">{ticket.id.toString().slice(-8)}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 gap-1.5 h-9 rounded-lg">
                    Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
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

export default MyTicketsPage;
