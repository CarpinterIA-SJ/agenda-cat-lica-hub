import { useState, useEffect, useMemo } from "react";
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
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  User, 
  Mail, 
  ChevronRight, 
  Phone, 
  Hash, 
  CalendarDays 
} from "lucide-react";
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
        { id: "2", label: "E-mail", type: "email", required: true },
        { id: "3", label: "WhatsApp", type: "tel", required: true }
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
  
  // Estado do formulário: ticketId e valores dos campos dinâmicos
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
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
    setSelectedTicketId(null);
    
    // Inicializar formValues com campos vazios
    const initialValues: Record<string, any> = {};
    const fields = event.details?.formFields || [];
    
    // Se não houver campos configurados, garantimos Nome e Email como fallback interno
    if (fields.length === 0) {
      initialValues['nome_default'] = "";
      initialValues['email_default'] = "";
    } else {
      fields.forEach((f: any) => {
        initialValues[f.id] = f.type === 'checkbox' ? false : "";
      });
    }
    
    setFormValues(initialValues);
    setIsModalOpen(true);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Validação em tempo real
  const isFormValid = useMemo(() => {
    if (!selectedTicketId) return false;
    
    const fields = selectedEvent?.details?.formFields || [];
    
    // Se não houver campos, validar os defaults
    if (fields.length === 0) {
      return formValues['nome_default']?.trim().length > 0 && 
             formValues['email_default']?.trim().length > 0;
    }
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    return fields.every((field: any) => {
      if (!field.required) return true;
      const val = formValues[field.id];
      if (field.type === 'checkbox') return val === true;
      return val && val.toString().trim().length > 0;
    });
  }, [selectedTicketId, formValues, selectedEvent]);

  const handleRegister = () => {
    toast.success("Inscrição confirmada!", {
      description: `Sua participação no evento "${selectedEvent?.name}" foi registrada com sucesso.`
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
          <Card key={event.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-all group border-l-4 border-l-transparent hover:border-l-[#007600] overflow-hidden bg-card">
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
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-[#007600]">Inscrição no Evento</DialogTitle>
            <DialogDescription className="text-base font-medium">
              {selectedEvent?.name}
            </DialogDescription>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
               <span className="flex items-center gap-1"><Calendar days="w-3.5 h-3.5" /> {selectedEvent?.date}</span>
               <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedEvent?.location}</span>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* Seção 1: Ingressos */}
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-tight">
                <Ticket className="w-4 h-4 text-[#007600]" />
                1. Escolha sua opção de entrada
              </h4>
              <div className="grid gap-3">
                {selectedEvent?.details?.tickets?.map((ticket: any) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                      selectedTicketId === ticket.id 
                        ? "border-[#007600] bg-[#007600]/5 ring-1 ring-[#007600]" 
                        : "border-border hover:border-[#007600]/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                         selectedTicketId === ticket.id ? "border-[#007600]" : "border-muted-foreground/30"
                       }`}>
                         {selectedTicketId === ticket.id && <div className="w-2 h-2 rounded-full bg-[#007600]" />}
                       </div>
                       <div>
                         <p className="font-bold text-sm">{ticket.name}</p>
                         <p className="text-[10px] text-muted-foreground">Clique para selecionar</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base text-[#007600]">
                        {Number(ticket.price) === 0 ? "Grátis" : `R$ ${ticket.price}`}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground bg-muted/20">
                    <p className="text-sm">Configurando ingressos padrão...</p>
                    <Button 
                       variant="outline" 
                       size="sm" 
                       className="mt-3 text-[#007600] border-[#007600]/30"
                       onClick={() => setSelectedTicketId("default")}
                    >
                      Usar Entrada Geral
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Seção 2: Formulário Dinâmico */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-tight">
                <User className="w-4 h-4 text-[#007600]" />
                2. Informações do Participante
              </h4>
              <div className="grid gap-5">
                {/* Fallback se não houver campos configurados */}
                {(!selectedEvent?.details?.formFields || selectedEvent?.details?.formFields.length === 0) && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">Nome Completo <span className="text-red-500">*</span></Label>
                      <Input 
                        placeholder="Como deseja ser chamado?" 
                        className="focus-visible:ring-[#007600]"
                        value={formValues['nome_default'] || ""}
                        onChange={(e) => handleFieldChange('nome_default', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">E-mail <span className="text-red-500">*</span></Label>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="focus-visible:ring-[#007600]"
                        value={formValues['email_default'] || ""}
                        onChange={(e) => handleFieldChange('email_default', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Renderização Dinâmica Conforme Cadastro */}
                {selectedEvent?.details?.formFields?.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {field.type === "text" && (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          placeholder={field.placeholder || `Digite seu ${field.label.toLowerCase()}`}
                          className="pl-10 focus-visible:ring-[#007600]"
                          value={formValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      </div>
                    )}
                    
                    {field.type === "email" && (
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          type="email" 
                          placeholder={field.placeholder || "seu@email.com"}
                          className="pl-10 focus-visible:ring-[#007600]"
                          value={formValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      </div>
                    )}

                    {field.type === "tel" && (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          type="tel" 
                          placeholder={field.placeholder || "(00) 00000-0000"}
                          className="pl-10 focus-visible:ring-[#007600]"
                          value={formValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      </div>
                    )}

                    {field.type === "number" && (
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          type="number" 
                          placeholder={field.placeholder || "0"}
                          className="pl-10 focus-visible:ring-[#007600]"
                          value={formValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      </div>
                    )}

                    {field.type === "date" && (
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input 
                          type="date" 
                          className="pl-10 focus-visible:ring-[#007600]"
                          value={formValues[field.id] || ""}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      </div>
                    )}
                    
                    {field.type === "select" && (
                      <Select onValueChange={(val) => handleFieldChange(field.id, val)}>
                        <SelectTrigger className="focus:ring-[#007600]">
                          <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt: any) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          )) || <SelectItem value="default">Opção Padrão</SelectItem>}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {field.type === "checkbox" && (
                      <div 
                        className={`flex items-start space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${
                          formValues[field.id] ? "bg-[#007600]/5 border-[#007600]/30" : "bg-muted/10 border-transparent hover:border-muted-foreground/20"
                        }`}
                        onClick={() => handleFieldChange(field.id, !formValues[field.id])}
                      >
                        <Checkbox 
                          id={field.id} 
                          checked={formValues[field.id] || false}
                          className="mt-0.5 data-[state=checked]:bg-[#007600] data-[state=checked]:border-[#007600]"
                        />
                        <div className="grid gap-1">
                          <label htmlFor={field.id} className="text-sm font-semibold leading-none cursor-pointer">
                            {field.label}
                          </label>
                          <p className="text-[11px] text-muted-foreground">Li e concordo com os termos desta opção.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t gap-3 flex-col sm:flex-row bg-muted/10 -mx-6 px-6 -mb-6 pb-6 mt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="sm:flex-1">Cancelar</Button>
            <Button 
              onClick={handleRegister}
              disabled={!isFormValid}
              className={`sm:flex-[2] h-12 font-bold shadow-lg transition-all ${
                isFormValid 
                  ? "bg-[#007600] hover:bg-[#006000] hover:scale-[1.02]" 
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isFormValid ? "Finalizar Inscrição" : "Preencha os campos obrigatórios"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;
