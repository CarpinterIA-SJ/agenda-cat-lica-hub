import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Calendar, MapPin, Users, Ticket, User, Mail, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const mockEvents = [
  { 
    id: 1, 
    name: "Retiro de Quaresma", 
    date: "28 Mar 2026", 
    location: "Paróquia São José", 
    type: "Presencial", 
    attendees: 120, 
    status: "Ativo",
    details: {
      tickets: [{ id: "1", name: "Inscrição Geral", price: "0" }],
      formFields: [
        { id: "1", label: "Nome Completo", type: "text", required: true },
        { id: "2", label: "E-mail", type: "email", required: true }
      ]
    }
  },
  { id: 2, name: "Missa Solene de Páscoa", date: "05 Abr 2026", location: "Catedral Central", type: "Híbrido", attendees: 350, status: "Ativo" },
  { id: 3, name: "Encontro de Jovens", date: "12 Abr 2026", location: "Centro Pastoral", type: "Presencial", attendees: 85, status: "Rascunho" },
];

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [registrationData, setRegistrationData] = useState<any>({});
  
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "participant";

  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (storedEvents.length > 0) {
        setEvents([...storedEvents, ...mockEvents]);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos locais:", error);
    }
  }, []);

  const filtered = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenRegistration = (event: any) => {
    setSelectedEvent(event);
    setRegistrationData({});
    setIsModalOpen(true);
  };

  const handleRegister = () => {
    toast.success("Inscrição realizada com sucesso!", {
      description: `Sua participação no evento "${selectedEvent?.name}" foi confirmada.`
    });
    
    // Simular incremento de inscritos
    const updatedEvents = events.map(e => 
      e.id === selectedEvent.id ? { ...e, attendees: (e.attendees || 0) + 1 } : e
    );
    setEvents(updatedEvents);
    
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Guardião Eventos</h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "organizer" ? "Gerencie seus eventos e acompanhe as inscrições" : "Descubra e inscreva-se nos eventos da sua comunidade"}
          </p>
        </div>
        {userRole === "organizer" && (
          <Button onClick={() => navigate("/events/new")} className="gap-2 bg-[#007600] hover:bg-[#006000]">
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar eventos..." className="pl-10 focus-visible:ring-[#007600]" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((event) => (
          <Card key={event.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-all group border-l-4 border-l-transparent hover:border-l-[#007600] overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    event.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {event.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007600]/10 text-[#007600] font-bold uppercase tracking-wider">
                    {event.type}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg text-card-foreground group-hover:text-[#007600] transition-colors mb-4 line-clamp-2 min-h-[3.5rem]">
                  {event.name}
                </h3>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#007600]" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#007600]" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-foreground/70">
                    <Users className="w-4 h-4 text-[#007600]" />
                    {event.attendees || 0} inscritos
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-muted/30 border-t mt-auto">
                <Button 
                  disabled={event.status !== "Ativo"}
                  onClick={() => handleOpenRegistration(event)}
                  className={`w-full gap-2 font-semibold ${
                    event.status === "Ativo" 
                      ? "bg-[#007600] hover:bg-[#006000] text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  Inscrever-se
                </Button>
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

      {/* Modal de Inscrição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#007600]">Inscrição no Evento</DialogTitle>
            <DialogDescription>
              {selectedEvent?.name} • {selectedEvent?.date}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* Seleção de Ingresso */}
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <Ticket className="w-4 h-4 text-[#007600]" />
                1. Selecione o Ingresso
              </h4>
              <div className="grid gap-3">
                {selectedEvent?.details?.tickets?.map((ticket: any) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setRegistrationData({...registrationData, ticketId: ticket.id})}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      registrationData.ticketId === ticket.id 
                        ? "border-[#007600] bg-[#007600]/5" 
                        : "border-border hover:border-[#007600]/30"
                    }`}
                  >
                    <div>
                      <p className="font-bold">{ticket.name}</p>
                      <p className="text-xs text-muted-foreground">Disponível para inscrição imediata</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#007600]">
                        {Number(ticket.price) === 0 ? "Grátis" : `R$ ${ticket.price}`}
                      </p>
                      {registrationData.ticketId === ticket.id && <span className="text-[10px] text-[#007600] font-bold uppercase">Selecionado</span>}
                    </div>
                  </div>
                )) || (
                  <div className="p-4 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                    Este evento ainda não possui ingressos configurados.
                  </div>
                )}
              </div>
            </div>

            {/* Formulário Dinâmico */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-bold flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-[#007600]" />
                2. Informações do Participante
              </h4>
              <div className="grid gap-5">
                {/* Campos Padrão se não houver dinâmicos */}
                {(!selectedEvent?.details?.formFields || selectedEvent?.details?.formFields.length === 0) && (
                  <>
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input placeholder="Seu nome" />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail *</Label>
                      <Input type="email" placeholder="seu@email.com" />
                    </div>
                  </>
                )}

                {/* Renderização Dinâmica */}
                {selectedEvent?.details?.formFields?.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1 group">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === "text" && (
                      <Input placeholder={`Digite seu ${field.label.toLowerCase()}`} className="focus-visible:ring-[#007600]" />
                    )}
                    
                    {field.type === "email" && (
                      <Input type="email" placeholder="seu@email.com" className="focus-visible:ring-[#007600]" />
                    )}
                    
                    {field.type === "select" && (
                      <Select>
                        <SelectTrigger className="focus:ring-[#007600]">
                          <SelectValue placeholder="Selecione uma opção" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt: any) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          )) || <SelectItem value="default">Opção Padrão</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {field.type === "checkbox" && (
                      <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border border-transparent hover:border-[#007600]/20 transition-colors">
                        <Checkbox id={field.id} className="data-[state=checked]:bg-[#007600] data-[state=checked]:border-[#007600]" />
                        <label htmlFor={field.id} className="text-sm font-medium leading-none cursor-pointer">
                          Eu aceito os termos relacionados a: {field.label}
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t gap-2 flex-col sm:flex-row">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleRegister}
              disabled={!registrationData.ticketId}
              className="bg-[#007600] hover:bg-[#006000] gap-2 px-8 h-11"
            >
              Confirmar Inscrição
              <ChevronRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;
