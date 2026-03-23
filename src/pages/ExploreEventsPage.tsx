import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Calendar, MapPin, Users, Ticket, User, Mail, ChevronRight,
  Phone, Hash, CreditCard, AlertTriangle, Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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
        { id: "3", label: "WhatsApp", type: "tel", required: true },
      ],
    },
  },
];

const ExploreEventsPage = () => {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const { user } = useAuth();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("custom_events") || "[]");
      if (stored.length > 0) setEvents([...stored, ...mockEvents]);
    } catch {
      // ignore
    }
  }, []);

  const filtered = events.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const handleOpenRegistration = (event: any) => {
    setSelectedEvent(event);
    setSelectedTicketId(null);
    setSelectedPaymentMethod(null);
    const initialValues: Record<string, any> = {
      fixed_nome: user?.user_metadata?.full_name || "",
      fixed_cpf: "",
      fixed_tel: "",
      fixed_email: user?.email || "",
      fixed_nascimento: "",
    };
    const fields = event.custom_fields || event.details?.formFields || [];
    fields.forEach((f: any) => {
      initialValues[f.id] = f.type === "checkbox" ? false : "";
    });
    setFormValues(initialValues);
    setIsModalOpen(true);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const isDuplicate = useMemo(() => {
    if (!selectedEvent) return false;
    const registrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
    const currentCpf = formValues["fixed_cpf"];
    return registrations.some(
      (reg: any) => reg.eventId === selectedEvent.id && currentCpf && reg.values?.fixed_cpf === currentCpf
    );
  }, [formValues, selectedEvent]);

  const isFormValid = useMemo(() => {
    if (!selectedTicketId || isDuplicate) return false;
    if (selectedEvent?.show_nome !== false && !formValues["fixed_nome"]?.trim()) return false;
    if (selectedEvent?.show_cpf !== false && !formValues["fixed_cpf"]?.trim()) return false;
    if (selectedEvent?.show_whatsapp !== false && !formValues["fixed_tel"]?.trim()) return false;
    if (selectedEvent?.show_email !== false && !formValues["fixed_email"]?.trim()) return false;
    if (selectedEvent?.show_nascimento !== false && !formValues["fixed_nascimento"]?.trim()) return false;
    return true;
  }, [selectedTicketId, formValues, selectedEvent, isDuplicate]);

  const handleRegister = () => {
    if (isDuplicate) {
      toast.error("Este CPF já possui uma inscrição para este evento.");
      return;
    }
    const registrations = JSON.parse(localStorage.getItem("event_registrations") || "[]");
    const newReg = {
      id: Date.now(),
      eventId: selectedEvent.id,
      email: formValues["fixed_email"],
      phone: formValues["fixed_tel"],
      ticketId: selectedTicketId,
      paymentMethod: selectedPaymentMethod,
      values: formValues,
    };
    localStorage.setItem("event_registrations", JSON.stringify([...registrations, newReg]));
    toast.success("Inscrição confirmada!", {
      description: `Sua participação no evento "${selectedEvent?.name}" foi registrada.`,
    });
    const updated = events.map((e) =>
      e.id === selectedEvent.id ? { ...e, attendees: (e.attendees || 0) + 1 } : e
    );
    setEvents(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Explorar Eventos</h1>
        <p className="text-muted-foreground mt-1">Descubra e inscreva-se nos eventos da sua comunidade</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar eventos..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((event) => (
          <Card key={event.id} className="flex flex-col shadow-card hover:shadow-card-hover transition-all group border-l-4 border-l-transparent hover:border-l-primary overflow-hidden bg-card">
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    event.status === "Ativo" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {event.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase tracking-wider">
                    {event.type}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors mb-4 line-clamp-2 min-h-[3.5rem]">
                  {event.name}
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {event.date}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><span className="truncate">{event.location}</span></div>
                  <div className="flex items-center gap-2 font-medium text-foreground/70"><Users className="w-4 h-4 text-primary" /> {event.attendees || 0} inscritos</div>
                </div>
              </div>
              <div className="p-5 bg-muted/30 border-t mt-auto">
                <Button
                  disabled={event.status !== "Ativo"}
                  onClick={() => handleOpenRegistration(event)}
                  className="w-full gap-2 font-semibold"
                >
                  <Ticket className="w-4 h-4" /> Inscrever-se
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="w-6 h-6" /> Inscrição no Evento
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium text-lg mt-1">
                {selectedEvent?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-8 pb-32">
            {isDuplicate && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">Já identificamos uma inscrição com este CPF.</p>
              </div>
            )}

            {/* Tickets */}
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                <Hash className="w-4 h-4 text-primary" /> 1. Escolha sua Entrada
              </h4>
              <div className="grid gap-3">
                {(selectedEvent?.tickets || selectedEvent?.details?.tickets)?.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      selectedTicketId === ticket.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTicketId === ticket.id ? "border-primary" : "border-muted-foreground/30"
                      }`}>
                        {selectedTicketId === ticket.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{ticket.name}</p>
                        <p className="text-[10px] text-muted-foreground">Disponibilidade imediata</p>
                      </div>
                    </div>
                    <p className="font-black text-lg text-primary">
                      {Number(ticket.price) === 0 ? "GRÁTIS" : `R$ ${ticket.price}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                <User className="w-4 h-4 text-primary" /> 2. Suas Informações
              </h4>
              <div className="grid gap-5">
                {selectedEvent?.show_nome !== false && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> Nome Completo *
                    </Label>
                    <Input placeholder="Como deseja ser identificado" className="h-11" value={formValues["fixed_nome"] || ""} onChange={(e) => handleFieldChange("fixed_nome", e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent?.show_cpf !== false && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Fingerprint className="w-3 h-3" /> CPF *</Label>
                      <Input placeholder="000.000.000-00" className="h-11" value={formValues["fixed_cpf"] || ""} onChange={(e) => handleFieldChange("fixed_cpf", e.target.value)} />
                    </div>
                  )}
                  {selectedEvent?.show_nascimento !== false && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Data de Nascimento *</Label>
                      <Input type="date" className="h-11" value={formValues["fixed_nascimento"] || ""} onChange={(e) => handleFieldChange("fixed_nascimento", e.target.value)} />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedEvent?.show_whatsapp !== false && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone (WhatsApp) *</Label>
                      <Input type="tel" placeholder="(00) 00000-0000" className="h-11" value={formValues["fixed_tel"] || ""} onChange={(e) => handleFieldChange("fixed_tel", e.target.value)} />
                    </div>
                  )}
                  {selectedEvent?.show_email !== false && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> E-mail *</Label>
                      <Input type="email" readOnly className="h-11 bg-muted/30 cursor-not-allowed" value={formValues["fixed_email"] || ""} />
                      <p className="text-[10px] text-muted-foreground italic">E-mail da sua conta Guardião.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-card border-t p-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button disabled={!isFormValid} onClick={handleRegister} className="gap-2">
              <Ticket className="w-4 h-4" /> Confirmar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExploreEventsPage;
