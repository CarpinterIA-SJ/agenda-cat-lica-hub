import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Search, Calendar, MapPin, ArrowRight, ExternalLink, MessageCircle, Clock, BellRing, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useMyWaitlist, useLeaveWaitlist } from "@/hooks/use-waitlist";

const statusLabel: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  waitlist: "Fila de espera",
};

const locationLabel = (loc: any) => {
  if (!loc) return "Local a confirmar";
  if (typeof loc === "string") return loc;
  return loc.name || loc.city || loc.address || "Local a confirmar";
};

const WAITLIST_STATUS_LABEL: Record<string, string> = {
  waiting: "Aguardando",
  notified: "Vaga disponível!",
  expired: "Expirado",
  converted: "Convertido",
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const { data: registrations = [], isLoading: loading } = useMyRegistrations();
  const { data: waitlist = [] } = useMyWaitlist();
  const leaveWaitlist = useLeaveWaitlist();
  const [search, setSearch] = useState("");

  const tickets = registrations.map((reg) => ({
    id: reg.id,
    eventName: reg.event?.name || "Evento",
    eventDate: reg.event?.start_at
      ? new Date(reg.event.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      : "Data a confirmar",
    eventLocation: locationLabel(reg.event?.location),
    ticketName: "Ingresso",
    status: statusLabel[reg.status] || reg.status,
  }));

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ingressos</h1>
          <p className="text-slate-500 mt-1">Veja todos os seus ingressos e inscrições em um só lugar.</p>
        </div>
        <Button 
          onClick={() => navigate("/participante/explorar")} 
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
          maxLength={100}
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
              onClick={() => navigate("/participante/explorar")}
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg text-[#25D366] hover:bg-[#25D366]/10"
                      title="Compartilhar no WhatsApp"
                      onClick={() => {
                        const msg = `Meu ingresso: ${ticket.eventName} — ${ticket.eventDate} em ${ticket.eventLocation}. Confirmado! 🎉`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary font-bold hover:bg-primary/5 gap-1.5 h-9 rounded-lg"
                      onClick={() => navigate(`/participante/meus-ingressos/${ticket.id}`)}
                    >
                      Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {waitlist.length > 0 && (
        <div className="space-y-4 pt-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fila de espera</h2>
            <p className="text-slate-500 mt-1">Eventos esgotados em que você aguarda uma vaga.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waitlist.map((w) => {
              const notified = w.status === "notified";
              return (
                <Card
                  key={w.id}
                  className={`overflow-hidden border shadow-sm ${notified ? "border-emerald-300" : "border-slate-200"}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">
                        {w.event?.name || "Evento"}
                      </h3>
                      <Badge
                        className={
                          notified
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1"
                            : w.status === "expired"
                            ? "bg-slate-200 text-slate-600 hover:bg-slate-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                        }
                      >
                        {notified && <BellRing className="w-3 h-3" />}
                        {WAITLIST_STATUS_LABEL[w.status] ?? w.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        {w.event?.start_at
                          ? new Date(w.event.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
                          : "Data a confirmar"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary/70" />
                        {w.status === "waiting" ? `Posição ${w.position} na fila` : `Posição ${w.position}`}
                      </div>
                    </div>

                    {notified && (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                        Vaga disponível! Você tem até{" "}
                        <b>{w.expires_at ? new Date(w.expires_at).toLocaleString("pt-BR") : "o prazo informado"}</b>{" "}
                        para se inscrever.
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {notified && w.event?.slug && (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1"
                          onClick={() => navigate(`/evento/${w.event!.slug}`)}
                        >
                          Inscrever agora <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="flex-1 gap-1 text-slate-600"
                        disabled={leaveWaitlist.isPending}
                        onClick={() =>
                          leaveWaitlist.mutate(
                            { id: w.id, eventId: w.event_id },
                            { onSuccess: () => toast.success("Você saiu da fila de espera.") },
                          )
                        }
                      >
                        <LogOut className="w-4 h-4" /> Sair da fila
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
