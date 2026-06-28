import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar, MapPin, Building2, Ticket, ClipboardList, AlertTriangle, Percent,
  User, Mail, Fingerprint, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCreateRegistration } from "@/hooks/use-registrations";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { CheckoutModal } from "@/components/CheckoutModal";
import { ChargeSummary, computeCharge } from "@/components/ChargeSummary";

type StandardFieldKey = "nome" | "email" | "cpf" | "nascimento" | "whatsapp";

type UnifiedField =
  | { kind: "standard"; key: StandardFieldKey; id: string; label: string; required: boolean; icon: any; inputType?: string; placeholder?: string; readOnly?: boolean; helper?: string }
  | { kind: "custom"; id: string; label: string; required: boolean; type?: string; options?: string[] };

/** Monta a lista unificada de campos (padrão + customizados) configurada pelo organizador. */
export const buildUnifiedFields = (event: any): UnifiedField[] => {
  if (!event) return [];
  const fields: UnifiedField[] = [];
  if (event.show_nome !== false) {
    fields.push({ kind: "standard", key: "nome", id: "fixed_nome", label: "Nome completo", required: true, icon: User, placeholder: "Como deseja ser identificado" });
  }
  if (event.show_email !== false) {
    fields.push({ kind: "standard", key: "email", id: "fixed_email", label: "E-mail", required: true, icon: Mail, inputType: "email", readOnly: true, helper: "E-mail da sua conta Guardião." });
  }
  if (event.show_cpf !== false) {
    fields.push({ kind: "standard", key: "cpf", id: "fixed_cpf", label: "CPF", required: true, icon: Fingerprint, placeholder: "000.000.000-00" });
  }
  if (event.show_nascimento === true) {
    fields.push({ kind: "standard", key: "nascimento", id: "fixed_nascimento", label: "Data de nascimento", required: true, icon: Calendar, inputType: "date" });
  }
  if (event.show_whatsapp !== false) {
    fields.push({ kind: "standard", key: "whatsapp", id: "fixed_tel", label: "Telefone (WhatsApp)", required: true, icon: Phone, inputType: "tel", placeholder: "(00) 00000-0000" });
  }
  const custom = event.custom_fields || event.details?.formFields || [];
  custom.forEach((f: any) => {
    fields.push({
      kind: "custom",
      id: f.id,
      label: f.label,
      required: f.required !== false,
      type: f.type || "text",
      options: Array.isArray(f.options) ? f.options : undefined,
    });
  });
  return fields;
};

interface EventRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  /** View-model do evento (deve conter id, name, date, location, organizerName, show_*, custom_fields). */
  event: any | null;
  /** Ingressos do evento: [{ id, name, price, type }]. */
  tickets: any[];
}

/**
 * Modal de inscrição completo, compartilhado entre o Explorar e a página
 * pública do evento. Lista/seleciona ingressos, valida cupom (tabela coupons),
 * renderiza o formulário configurado pelo organizador, mostra o resumo de
 * cobrança com taxa e direciona gratuito → registro confirmado / pago → Stripe.
 */
export const EventRegistrationModal = ({ open, onClose, event, tickets }: EventRegistrationModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createRegistration = useCreateRegistration();
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<{ modo: "percentual" | "fixo"; valor: string; codigo: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkout, setCheckout] = useState<{ ticketId: string; name: string; quantity: number; coupon: string | null } | null>(null);

  // Quando o organizador ainda não cadastrou ingressos, oferece uma entrada
  // gratuita sintética para o participante conseguir enviar o formulário.
  const modalTickets = useMemo(() => {
    const configured = tickets || [];
    if (configured.length > 0) return configured;
    return [{ id: "default-free", name: "Inscrição gratuita", price: "0" }];
  }, [tickets]);

  // Inicializa o formulário e reseta seleção/cupom ao abrir (ou trocar de evento).
  useEffect(() => {
    if (!open || !event) return;
    setSelectedTicketId(null);
    setCouponCode("");
    setCouponDiscount(null);
    setCouponError("");
    const initialValues: Record<string, any> = {
      fixed_nome: user?.user_metadata?.full_name || "",
      fixed_cpf: "",
      fixed_tel: "",
      fixed_email: user?.email || "",
      fixed_nascimento: "",
    };
    (event.custom_fields || []).forEach((f: any) => {
      initialValues[f.id] = f.type === "checkbox" ? [] : "";
    });
    setFormValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event?.id]);

  useEffect(() => {
    if (open && modalTickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(modalTickets[0].id);
    }
  }, [open, modalTickets, selectedTicketId]);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !event) return;
    try {
      const { data: found, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("event_id", event.id)
        .eq("code", couponCode.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!found) {
        setCouponError("Cupom inválido ou inativo.");
        setCouponDiscount(null);
        return;
      }
      if (found.max_uses != null && found.used_count >= found.max_uses) {
        setCouponError("Cupom esgotado.");
        setCouponDiscount(null);
        return;
      }
      setCouponDiscount({
        modo: found.discount_kind === "percent" ? "percentual" : "fixo",
        valor: String(found.discount_value),
        codigo: found.code,
      });
      setCouponError("");
    } catch {
      setCouponError("Erro ao validar cupom.");
    }
  };

  const calcDiscountedPrice = (price: number) => {
    if (!couponDiscount || price === 0) return price;
    if (couponDiscount.modo === "percentual") {
      return Math.max(0, price - price * (parseFloat(couponDiscount.valor) / 100));
    }
    return Math.max(0, price - parseFloat(couponDiscount.valor));
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // A verificação de duplicidade por CPF é responsabilidade do backend (RLS/constraints).
  const isDuplicate = false;

  const unifiedFields = useMemo(() => buildUnifiedFields(event), [event]);

  const selectedTicket = modalTickets.find((t: any) => t.id === selectedTicketId);
  const selectedPriceCents = selectedTicket
    ? Math.round(calcDiscountedPrice(Number(selectedTicket.price || 0)) * 100)
    : 0;
  const selectedCharge = computeCharge(selectedPriceCents, 1, taxaPercent);

  const isFormValid = useMemo(() => {
    if (!selectedTicketId || isDuplicate) return false;
    return unifiedFields.every((f) => {
      if (!f.required) return true;
      const raw = formValues[f.id];
      if (Array.isArray(raw)) return raw.length > 0;
      return typeof raw === "string" ? raw.trim().length > 0 : !!raw;
    });
  }, [selectedTicketId, formValues, unifiedFields, isDuplicate]);

  const handleRegister = async () => {
    if (!event) return;

    // Ingresso pago → checkout obrigatório (Stripe). A inscrição é criada
    // (pending) pelo backend e confirmada via webhook após o pagamento.
    if (selectedPriceCents > 0) {
      if (!user) {
        toast.info("Entre na sua conta para concluir o pagamento.");
        navigate("/login");
        return;
      }
      const ticketId = selectedTicketId && selectedTicketId !== "default-free" ? selectedTicketId : null;
      if (!ticketId) {
        toast.error("Selecione um ingresso válido para pagamento.");
        return;
      }
      onClose();
      setCheckout({
        ticketId,
        name: selectedTicket?.name ?? "Ingresso",
        quantity: 1,
        coupon: couponDiscount?.codigo ?? null,
      });
      return;
    }

    // Coleta os valores dos campos customizados configurados pelo organizador.
    const customValues: Record<string, any> = {};
    (event.custom_fields || []).forEach((f: any) => {
      customValues[f.id] = formValues[f.id];
    });
    try {
      await createRegistration.mutateAsync({
        event_id: event.id,
        ticket_id: selectedTicketId && selectedTicketId !== "default-free" ? selectedTicketId : null,
        user_id: user?.id ?? null,
        full_name: formValues["fixed_nome"] || "",
        email: formValues["fixed_email"] || "",
        cpf: formValues["fixed_cpf"] || null,
        phone: formValues["fixed_tel"] || null,
        birth_date: formValues["fixed_nascimento"] || null,
        custom_fields: customValues as any,
        status: "confirmed",
      });
      toast.success("Inscrição confirmada!", {
        description: `Sua participação no evento "${event?.name}" foi registrada.`,
      });
      onClose();
    } catch (e: any) {
      toast.error("Erro ao confirmar inscrição", { description: e.message });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-none rounded-2xl shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="w-6 h-6" /> Inscrição no Evento
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium text-lg mt-1">
                {event?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-primary-foreground/80">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {event?.date}</span>
              {event?.location && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
              )}
              {event?.organizerName && (
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {event.organizerName}</span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8 pb-32">
            {isDuplicate && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">Já identificamos uma inscrição com este CPF.</p>
              </div>
            )}

            {/* Seleção de ingresso (exibida quando há mais de um) */}
            {modalTickets.length > 1 && (
              <div className="space-y-3">
                <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                  <Ticket className="w-4 h-4 text-primary" /> Ingressos
                </h4>
                <div className="grid gap-2">
                  {modalTickets.map((t: any) => {
                    const isSelected = t.id === selectedTicketId;
                    const priceLabel = Number(t.price) === 0 ? "Gratuito" : `R$ ${t.price}`;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                          isSelected ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"
                        }`}
                      >
                        <span className="font-semibold text-sm text-foreground">{t.name}</span>
                        <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground/70"}`}>{priceLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulário de inscrição configurado pelo organizador */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                  <ClipboardList className="w-4 h-4 text-primary" /> Formulário de inscrição
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Preencha os campos definidos pelo organizador para concluir sua inscrição.</p>
              </div>
              {unifiedFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">O organizador ainda não configurou campos para este formulário.</p>
              ) : (
                <div className="grid gap-5">
                  {unifiedFields.map((field) => {
                    const Icon = field.kind === "standard" ? field.icon : ClipboardList;
                    const value = formValues[field.id];
                    const labelEl = (
                      <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {field.label}{field.required ? " *" : ""}
                      </Label>
                    );

                    // Campos customizados com opções (radio / checkbox / select).
                    if (
                      field.kind === "custom" &&
                      field.options?.length &&
                      (field.type === "radio" || field.type === "checkbox" || field.type === "select")
                    ) {
                      if (field.type === "radio") {
                        return (
                          <div key={field.id} className="space-y-2">
                            {labelEl}
                            <RadioGroup
                              value={typeof value === "string" ? value : ""}
                              onValueChange={(v) => handleFieldChange(field.id, v)}
                              className="space-y-1"
                            >
                              {field.options.map((opt) => (
                                <div key={opt} className="flex items-center gap-2">
                                  <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                                  <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal text-foreground cursor-pointer">{opt}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        );
                      }
                      if (field.type === "checkbox") {
                        const arr: string[] = Array.isArray(value) ? value : [];
                        return (
                          <div key={field.id} className="space-y-2">
                            {labelEl}
                            <div className="space-y-1">
                              {field.options.map((opt) => (
                                <div key={opt} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`${field.id}-${opt}`}
                                    checked={arr.includes(opt)}
                                    onCheckedChange={(c) =>
                                      handleFieldChange(field.id, c === true ? [...arr, opt] : arr.filter((o) => o !== opt))
                                    }
                                  />
                                  <Label htmlFor={`${field.id}-${opt}`} className="text-sm font-normal text-foreground cursor-pointer">{opt}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      // select
                      return (
                        <div key={field.id} className="space-y-2">
                          {labelEl}
                          <Select value={typeof value === "string" ? value : ""} onValueChange={(v) => handleFieldChange(field.id, v)}>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                              {field.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    // Texto / campos padrão (comportamento original).
                    const inputType = field.kind === "standard" ? field.inputType : undefined;
                    const placeholder = field.kind === "standard" ? field.placeholder : field.label;
                    const readOnly = field.kind === "standard" && field.readOnly;
                    return (
                      <div key={field.id} className="space-y-2">
                        {labelEl}
                        <Input
                          type={inputType || "text"}
                          placeholder={placeholder || ""}
                          className={`h-11 ${readOnly ? "bg-muted/30 cursor-not-allowed" : ""}`}
                          value={typeof value === "string" ? value : value ? String(value) : ""}
                          readOnly={readOnly}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          maxLength={200}
                        />
                        {field.kind === "standard" && field.helper && (
                          <p className="text-[10px] text-muted-foreground italic">{field.helper}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-4 space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Percent className="w-3 h-3" /> Cupom de desconto
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); if (!e.target.value) setCouponDiscount(null); }}
                className="h-10 font-mono uppercase"
                maxLength={20}
              />
              <Button variant="outline" size="sm" className="h-10 px-4 shrink-0" onClick={validateCoupon} disabled={!couponCode.trim()}>
                Aplicar
              </Button>
            </div>
            {couponError && <p className="text-xs text-destructive">{couponError}</p>}
            {couponDiscount && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Percent className="w-3 h-3" />
                Cupom "{couponDiscount.codigo}" aplicado —{" "}
                {couponDiscount.modo === "percentual" ? `${couponDiscount.valor}% de desconto` : `R$ ${couponDiscount.valor} de desconto`}
              </p>
            )}
          </div>

          {selectedTicket && (
            <div className="px-6 pb-4">
              <ChargeSummary
                subtotalCents={selectedCharge.subtotal}
                taxaCents={selectedCharge.taxa}
                totalCents={selectedCharge.total}
                taxaPercent={selectedPriceCents > 0 ? taxaPercent : undefined}
              />
            </div>
          )}

          <DialogFooter className="sticky bottom-0 bg-card border-t p-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={!isFormValid} onClick={handleRegister} className="gap-2">
              <Ticket className="w-4 h-4" /> Confirmar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {checkout && event?.id && (
        <CheckoutModal
          eventId={event.id}
          ticketId={checkout.ticketId}
          ticketName={checkout.name}
          quantity={checkout.quantity}
          couponCode={checkout.coupon}
          onClose={() => setCheckout(null)}
        />
      )}
    </>
  );
};

export default EventRegistrationModal;
