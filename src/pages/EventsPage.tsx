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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  CalendarDays,
  CreditCard,
  QrCode,
  FileText,
  AlertTriangle
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
];

const EventsPage = () => {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Estado do formulário
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
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
    setSelectedPaymentMethod(null);
    
    const initialValues: Record<string, any> = {};
    const fields = event.custom_fields || event.details?.formFields || [];
    
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

  // Verificação de duplicidade
  const isDuplicate = useMemo(() => {
    if (!selectedEvent) return false;
    const registrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
    
    const currentEmail = formValues['email_default'] || 
      Object.entries(formValues).find(([id, val]) => {
        const field = (selectedEvent.custom_fields || selectedEvent.details?.formFields || []).find((f: any) => f.id === id);
        return field?.type === 'email' || field?.label?.toLowerCase().includes('email');
      })?.[1];

    const currentPhone = Object.entries(formValues).find(([id, val]) => {
      const field = (selectedEvent.custom_fields || selectedEvent.details?.formFields || []).find((f: any) => f.id === id);
      return field?.type === 'tel' || field?.label?.toLowerCase().includes('whatsapp') || field?.label?.toLowerCase().includes('telefone');
    })?.[1];

    return registrations.some((reg: any) => 
      reg.eventId === selectedEvent.id && 
      ((currentEmail && reg.email === currentEmail) || (currentPhone && reg.phone === currentPhone))
    );
  }, [formValues, selectedEvent]);

  // Validação do formulário
  const isFormValid = useMemo(() => {
    if (!selectedTicketId || isDuplicate) return false;
    
    const isPaid = selectedEvent?.type === "Pago" || selectedEvent?.is_free === false;
    if (isPaid && !selectedPaymentMethod) return false;

    const fields = selectedEvent?.custom_fields || selectedEvent?.details?.formFields || [];
    
    if (fields.length === 0) {
      return formValues['nome_default']?.trim().length > 0 && 
             formValues['email_default']?.trim().length > 0;
    }
    
    return fields.every((field: any) => {
      if (!field.required) return true;
      const val = formValues[field.id];
      if (field.type === 'checkbox') return val === true;
      return val && val.toString().trim().length > 0;
    });
  }, [selectedTicketId, selectedPaymentMethod, formValues, selectedEvent, isDuplicate]);

  const handleRegister = () => {
    if (isDuplicate) {
      toast.error("Você já possui uma inscrição para este evento.");
      return;
    }

    const email = formValues['email_default'] || 
      Object.entries(formValues).find(([id, val]) => {
        const field = (selectedEvent.custom_fields || selectedEvent.details?.formFields || []).find((f: any) => f.id === id);
        return field?.type === 'email' || field?.label?.toLowerCase().includes('email');
      })?.[1];

    const phone = Object.entries(formValues).find(([id, val]) => {
      const field = (selectedEvent.custom_fields || selectedEvent.details?.formFields || []).find((f: any) => f.id === id);
      return field?.type === 'tel' || field?.label?.toLowerCase().includes('whatsapp');
    })?.[1];

    // Salvar inscrição
    const registrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
    const newRegistration = {
      id: Date.now(),
      eventId: selectedEvent.id,
      email,
      phone,
      ticketId: selectedTicketId,
      paymentMethod: selectedPaymentMethod,
      values: formValues
    };
    localStorage.setItem("event_registrations", JSON.stringify([...registrations, newRegistration]));

    toast.success("Inscrição confirmada!", {
      description: `Sua participação no evento "${selectedEvent?.name}" foi registrada.`
    });
    
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
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-[#007600]" /> {event.date}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#007600]" /><span className="truncate">{event.location}</span></div>
                  <div className="flex items-center gap-2 font-medium text-foreground/70"><Users className="w-4 h-4 text-[#007600]" /> {event.attendees || 0} inscritos</div>
                </div>
              </div>
              
              <div className="p-5 bg-muted/30 border-t mt-auto">
                <Button 
                  disabled={event.status !== "Ativo"}
                  onClick={() => handleOpenRegistration(event)}
                  className={`w-full gap-2 font-semibold ${event.status === "Ativo" ? "bg-[#007600] hover:bg-[#006000] text-white" : "bg-muted text-muted-foreground"}`}
                >
                  <Ticket className="w-4 h-4" /> Inscrever-se
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Inscrição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
          <div className="bg-[#007600] p-6 text-white sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2"><Ticket className="w-6 h-6" /> Inscrição no Evento</DialogTitle>
              <DialogDescription className="text-white/80 font-medium text-lg mt-1">{selectedEvent?.name}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-8 pb-32">
            {isDuplicate && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold leading-tight">Já identificamos uma inscrição para este evento com suas credenciais (E-mail ou Telefone).</p>
              </div>
            )}

            {/* Ingressos */}
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider"><Hash className="w-4 h-4 text-[#007600]" /> 1. Escolha sua Entrada</h4>
              <div className="grid gap-3">
                {(selectedEvent?.tickets || selectedEvent?.details?.tickets)?.map((ticket: any) => (
                  <div key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)} className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${selectedTicketId === ticket.id ? "border-[#007600] bg-[#007600]/5 ring-1 ring-[#007600]" : "border-border hover:border-[#007600]/30"}`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTicketId === ticket.id ? "border-[#007600]" : "border-muted-foreground/30"}`}>
                         {selectedTicketId === ticket.id && <div className="w-2.5 h-2.5 rounded-full bg-[#007600]" />}
                       </div>
                       <div><p className="font-bold text-sm">{ticket.name}</p><p className="text-[10px] text-muted-foreground">Disponibilidade imediata</p></div>
                    </div>
                    <p className="font-black text-lg text-[#007600]">{Number(ticket.price) === 0 ? "GRÁTIS" : `R$ ${ticket.price}`}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider"><User className="w-4 h-4 text-[#007600]" /> 2. Suas Informações</h4>
              <div className="grid gap-5">
                {(selectedEvent?.custom_fields || selectedEvent?.details?.formFields || []).length === 0 ? (
                  <>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Nome Completo *</Label><Input placeholder="Ex: Maria José" className="h-11 focus-visible:ring-[#007600]" value={formValues['nome_default']} onChange={(e) => handleFieldChange('nome_default', e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">E-mail *</Label><Input type="email" placeholder="maria@email.com" className="h-11 focus-visible:ring-[#007600]" value={formValues['email_default']} onChange={(e) => handleFieldChange('email_default', e.target.value)} /></div>
                  </>
                ) : (
                  (selectedEvent.custom_fields || selectedEvent.details?.formFields).map((field: any) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                      {field.type === "text" && <Input placeholder={`Digite seu ${field.label.toLowerCase()}`} className="h-11 focus-visible:ring-[#007600]" value={formValues[field.id]} onChange={(e) => handleFieldChange(field.id, e.target.value)} />}
                      {field.type === "email" && <Input type="email" placeholder="seu@email.com" className="h-11 focus-visible:ring-[#007600]" value={formValues[field.id]} onChange={(e) => handleFieldChange(field.id, e.target.value)} />}
                      {field.type === "tel" && <Input type="tel" placeholder="(00) 00000-0000" className="h-11 focus-visible:ring-[#007600]" value={formValues[field.id]} onChange={(e) => handleFieldChange(field.id, e.target.value)} />}
                      {field.type === "number" && <Input type="number" className="h-11 focus-visible:ring-[#007600]" value={formValues[field.id]} onChange={(e) => handleFieldChange(field.id, e.target.value)} />}
                      {field.type === "date" && <Input type="date" className="h-11 focus-visible:ring-[#007600]" value={formValues[field.id]} onChange={(e) => handleFieldChange(field.id, e.target.value)} />}
                      {field.type === "select" && (
                        <Select onValueChange={(v) => handleFieldChange(field.id, v)}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>{field.options?.map((o: any) => <SelectItem key={o} value={o}>{o}</SelectItem>) || <SelectItem value="default">Opção Única</SelectItem>}</SelectContent>
                        </Select>
                      )}
                      {field.type === "checkbox" && (
                        <div className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${formValues[field.id] ? "bg-[#007600]/5 border-[#007600]/30" : "bg-muted/10 border-transparent"}`} onClick={() => handleFieldChange(field.id, !formValues[field.id])}>
                          <Checkbox checked={formValues[field.id] || false} className="data-[state=checked]:bg-[#007600] data-[state=checked]:border-[#007600]" />
                          <Label className="text-sm font-bold cursor-pointer">{field.label}</Label>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pagamento */}
            {(selectedEvent?.type === "Pago" || selectedEvent?.is_free === false) && (
              <div className="space-y-6 pt-6 border-t animate-in slide-in-from-bottom duration-500">
                <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider"><CreditCard className="w-4 h-4 text-[#007600]" /> 3. Escolha como Pagar</h4>
                <RadioGroup value={selectedPaymentMethod || ""} onValueChange={setSelectedPaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "pix", label: "PIX", icon: QrCode, desc: "Aprovação instantânea" },
                    { id: "card", label: "Cartão de Crédito", icon: CreditCard, desc: "Até 12x sem juros" },
                    { id: "boleto", label: "Boleto", icon: FileText, desc: "Vencimento em 3 dias" }
                  ].map((method) => (
                    <Label key={method.id} htmlFor={method.id} className={`flex flex-col gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all hover:bg-muted/50 ${selectedPaymentMethod === method.id ? "border-[#007600] bg-[#007600]/5" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <method.icon className={`w-5 h-5 ${selectedPaymentMethod === method.id ? "text-[#007600]" : "text-muted-foreground"}`} />
                        <RadioGroupItem value={method.id} id={method.id} className="text-[#007600]" />
                      </div>
                      <div className="mt-1">
                        <p className="font-bold text-sm">{method.label}</p>
                        <p className="text-[10px] text-muted-foreground">{method.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 bg-white border-t p-6 flex flex-col gap-3 sm:flex-row shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="sm:flex-1 h-12 font-bold">Cancelar</Button>
            <Button disabled={!isFormValid} onClick={handleRegister} className={`sm:flex-2 h-12 font-black text-lg transition-all ${isFormValid ? "bg-[#007600] hover:bg-[#006000] hover:scale-[1.02] shadow-xl shadow-[#007600]/20" : "bg-muted text-muted-foreground"}`}>
              {isDuplicate ? "Inscrição Já Realizada" : "CONFIRMAR INSCRIÇÃO"} <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;
