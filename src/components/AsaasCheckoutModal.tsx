// ============================================================
//  AsaasCheckoutModal — checkout via Asaas (PIX / Boleto / Cartão).
//
//  Usado pelo fluxo de inscrição em EventRegistrationModal.tsx para
//  ingressos pagos — substituiu o CheckoutModal.tsx do Stripe.
//
//  A rota /teste/asaas que o exercitava foi REMOVIDA antes do merge na
//  main: publicada pela Vercel ela ficaria acessível a qualquer usuário
//  logado e, com ASAAS_ENV=production, criaria cobrança de dinheiro
//  real. Para testar de novo, recrie a rota em branch, nunca na main.
//
//  Cartão: NÃO coletamos dados de cartão. O usuário é redirecionado
//  para a fatura hospedada pelo Asaas — é isso que mantém o Guardião
//  fora do escopo de certificação PCI-DSS SAQ-D.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { PatternFormat } from "react-number-format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Barcode,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  QrCode,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { ChargeSummary } from "@/components/ChargeSummary";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

interface CheckoutResponse {
  registration_id: string;
  charge_id: string;
  billing_type: BillingType;
  subtotal: number;
  taxa: number;
  total: number;
  ticket_name: string;
  due_date: string;
  invoice_url: string | null;
  /** null quando o Asaas não devolveu o QR — cai para invoice_url. */
  pix?: {
    qr_code_image: string | null;
    payload: string;
    expiration_date: string | null;
  } | null;
  boleto?: {
    bank_slip_url: string | null;
    identification_field: string | null;
  };
  credit_card?: { invoice_url: string | null };
}

interface AsaasCheckoutModalProps {
  eventId: string;
  ticketId: string;
  quantity: number;
  ticketName?: string;
  couponCode?: string | null;
  customFields?: Record<string, any>;
  onClose: () => void;
}

/** Intervalo do polling de confirmação e teto de tentativas (~10 min). */
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 120;

export const AsaasCheckoutModal = ({
  eventId,
  ticketId,
  quantity,
  ticketName,
  couponCode,
  customFields,
  onClose,
}: AsaasCheckoutModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);

  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [charge, setCharge] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const createCharge = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke("asaas-checkout", {
        body: {
          event_id: eventId,
          ticket_id: ticketId,
          quantity,
          user_id: user?.id ?? null,
          billing_type: billingType,
          cpf: cpf.replace(/\D/g, ""),
          phone: phone ? phone.replace(/\D/g, "") : null,
          coupon_code: couponCode ?? null,
          custom_fields: customFields ?? {},
        },
      });

      if (fnErr) {
        // Erro não-2xx: extrai a mensagem amigável do corpo (valor_minimo,
        // cpf_invalido, opção esgotada) em vez do genérico da lib.
        let msg = fnErr.message;
        const ctx = (fnErr as any).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            msg = body?.message || body?.error || msg;
          } catch { /* corpo não-JSON: mantém msg padrão */ }
        }
        throw new Error(msg);
      }
      if (res?.error) throw new Error(res.message || res.error);

      const data = res as CheckoutResponse;
      setCharge(data);

      // Cartão: a fatura hospedada do Asaas é o próximo passo. Redireciona
      // direto — nenhum dado de cartão passa por aqui.
      if (data.billing_type === "CREDIT_CARD") {
        const url = data.credit_card?.invoice_url ?? data.invoice_url;
        if (url) window.location.href = url;
      }
    } catch (e: any) {
      setError(e.message || "Falha ao gerar a cobrança.");
      toast({ title: "Erro no checkout", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const copy = useCallback(async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} copiado!` });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  }, [toast]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="
          flex flex-col gap-0 overflow-hidden p-0
          w-screen h-[100dvh] max-w-none rounded-none
          sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl
        "
      >
        <DialogHeader className="shrink-0 space-y-1 bg-[#004d00] p-4 text-left sm:p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <Ticket className="h-5 w-5" /> Finalizar inscrição
          </DialogTitle>
          <DialogDescription className="text-emerald-100">
            {ticketName ?? charge?.ticket_name ?? "Ingresso"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {charge && (
            <ChargeSummary
              subtotalCents={charge.subtotal}
              taxaCents={charge.taxa}
              totalCents={charge.total}
              taxaPercent={charge.subtotal > 0 ? taxaPercent : undefined}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {!charge ? (
            <PaymentMethodForm
              billingType={billingType}
              onBillingTypeChange={setBillingType}
              cpf={cpf}
              onCpfChange={setCpf}
              phone={phone}
              onPhoneChange={setPhone}
            />
          ) : paid ? (
            <ConfirmedPanel />
          ) : charge.billing_type === "PIX" ? (
            <PixPanel charge={charge} onCopy={copy} />
          ) : charge.billing_type === "BOLETO" ? (
            <BoletoPanel charge={charge} onCopy={copy} />
          ) : (
            <CreditCardPanel charge={charge} />
          )}

          {charge && !paid && charge.billing_type !== "CREDIT_CARD" && (
            <PaymentWatcher
              registrationId={charge.registration_id}
              onConfirmed={() => {
                setPaid(true);
                toast({ title: "Pagamento confirmado!", description: "Sua inscrição está garantida." });
              }}
            />
          )}

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Pagamento processado pelo Asaas
          </p>
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white p-4">
          {!charge && (
            <Button
              type="button"
              className="h-12 w-full bg-[#004d00] text-base font-semibold text-white hover:bg-[#003a00]"
              onClick={createCharge}
              disabled={submitting || cpf.replace(/\D/g, "").length < 11}
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Gerar cobrança"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-slate-500"
            onClick={onClose}
            disabled={submitting}
          >
            {paid ? "Fechar" : "Cancelar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Formulário inicial ─────────────────────────────────────

interface PaymentMethodFormProps {
  billingType: BillingType;
  onBillingTypeChange: (v: BillingType) => void;
  cpf: string;
  onCpfChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}

const METHODS: Array<{ value: BillingType; label: string; hint: string; icon: typeof QrCode }> = [
  { value: "PIX", label: "PIX", hint: "Aprovação imediata", icon: QrCode },
  { value: "BOLETO", label: "Boleto", hint: "Compensa em até 3 dias úteis", icon: Barcode },
  { value: "CREDIT_CARD", label: "Cartão de crédito", hint: "Você será levado ao ambiente seguro do Asaas", icon: CreditCard },
];

const PaymentMethodForm = ({
  billingType, onBillingTypeChange, cpf, onCpfChange, phone, onPhoneChange,
}: PaymentMethodFormProps) => (
  <div className="space-y-5">
    <div className="space-y-2">
      <Label className="text-sm font-semibold">Forma de pagamento</Label>
      <RadioGroup value={billingType} onValueChange={(v) => onBillingTypeChange(v as BillingType)}>
        {METHODS.map(({ value, label, hint, icon: Icon }) => (
          <label
            key={value}
            htmlFor={`billing-${value}`}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
          >
            <RadioGroupItem value={value} id={`billing-${value}`} className="mt-1" />
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#004d00]" />
            <span className="space-y-0.5">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>

    <div className="space-y-2">
      <Label htmlFor="asaas-cpf" className="text-sm font-semibold">
        CPF do pagador <span className="text-destructive">*</span>
      </Label>
      <PatternFormat
        id="asaas-cpf"
        format="###.###.###-##"
        mask="_"
        value={cpf}
        onValueChange={(v) => onCpfChange(v.value)}
        placeholder="000.000.000-00"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <p className="text-xs text-slate-500">
        Exigido pelo Asaas para emitir a cobrança. Não é exibido publicamente.
      </p>
    </div>

    <div className="space-y-2">
      <Label htmlFor="asaas-phone" className="text-sm font-semibold">
        Celular <span className="font-normal text-slate-400">(opcional)</span>
      </Label>
      <PatternFormat
        id="asaas-phone"
        format="(##) #####-####"
        mask="_"
        value={phone}
        onValueChange={(v) => onPhoneChange(v.value)}
        placeholder="(00) 00000-0000"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  </div>
);

// ─── Painéis por método ─────────────────────────────────────

const PixPanel = ({
  charge, onCopy,
}: { charge: CheckoutResponse; onCopy: (t: string, w: string) => void }) => (
  <div className="space-y-4 text-center">
    <p className="text-sm text-slate-600">
      Escaneie o QR Code no app do seu banco ou use o código copia-e-cola.
    </p>

    {charge.pix?.qr_code_image ? (
      <img
        src={charge.pix.qr_code_image}
        alt="QR Code do PIX"
        className="mx-auto h-56 w-56 rounded-xl border border-slate-200 bg-white p-2"
      />
    ) : (
      <p className="text-sm text-slate-500">
        Não conseguimos carregar o QR Code aqui, mas a cobrança está ativa —
        abra a fatura abaixo para pagar.
      </p>
    )}

    {/* Fallback quando o QR/copia-e-cola não veio: a fatura hospedada do
        Asaas mostra o mesmo PIX. */}
    {!charge.pix?.payload && charge.invoice_url && (
      <Button asChild className="w-full bg-[#004d00] hover:bg-[#003a00]">
        <a href={charge.invoice_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" /> Abrir fatura para pagar
        </a>
      </Button>
    )}

    {charge.pix?.payload && (
      <>
        <p className="break-all rounded-lg bg-slate-50 p-3 text-left font-mono text-[11px] text-slate-600">
          {charge.pix.payload}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onCopy(charge.pix!.payload, "Código PIX")}
        >
          <Copy className="mr-2 h-4 w-4" /> Copiar código PIX
        </Button>
      </>
    )}

    <p className="text-xs text-slate-500">
      Valor: <strong>{brl(charge.total)}</strong> · vence em {charge.due_date}
    </p>
  </div>
);

const BoletoPanel = ({
  charge, onCopy,
}: { charge: CheckoutResponse; onCopy: (t: string, w: string) => void }) => (
  <div className="space-y-4">
    <p className="text-sm text-slate-600">
      Pague o boleto no seu banco ou aplicativo. A confirmação leva até 3 dias úteis.
    </p>

    {charge.boleto?.identification_field ? (
      <>
        <p className="break-all rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600">
          {charge.boleto.identification_field}
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onCopy(charge.boleto!.identification_field!, "Linha digitável")}
        >
          <Copy className="mr-2 h-4 w-4" /> Copiar linha digitável
        </Button>
      </>
    ) : (
      <p className="text-sm text-slate-500">
        A linha digitável ainda está sendo registrada pelo banco. Abra o boleto pelo link abaixo.
      </p>
    )}

    {charge.boleto?.bank_slip_url && (
      <Button asChild className="w-full bg-[#004d00] hover:bg-[#003a00]">
        <a href={charge.boleto.bank_slip_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" /> Abrir boleto
        </a>
      </Button>
    )}

    <p className="text-center text-xs text-slate-500">
      Valor: <strong>{brl(charge.total)}</strong> · vence em {charge.due_date}
    </p>
  </div>
);

const CreditCardPanel = ({ charge }: { charge: CheckoutResponse }) => {
  const url = charge.credit_card?.invoice_url ?? charge.invoice_url;
  return (
    <div className="space-y-4 text-center">
      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#004d00]" />
      <p className="text-sm text-slate-600">
        Redirecionando para o ambiente seguro do Asaas para o pagamento com cartão…
      </p>
      {url && (
        <Button asChild className="w-full bg-[#004d00] hover:bg-[#003a00]">
          <a href={url}>
            <ExternalLink className="mr-2 h-4 w-4" /> Continuar para o pagamento
          </a>
        </Button>
      )}
      <p className="text-xs text-slate-500">
        Os dados do cartão são digitados no site do Asaas — o Guardião não os recebe nem armazena.
      </p>
    </div>
  );
};

const ConfirmedPanel = () => (
  <div className="space-y-3 py-6 text-center">
    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
    <p className="text-lg font-semibold text-emerald-800">Pagamento confirmado!</p>
    <p className="text-sm text-slate-600">
      Sua inscrição está garantida. O ingresso já aparece em “Meus ingressos”.
    </p>
  </div>
);

// ─── Acompanhamento da confirmação ──────────────────────────

/**
 * Observa a inscrição até o webhook do Asaas promovê-la a 'confirmed'.
 *
 * Consulta por `id` (chave primária) em vez de `gateway_charge_id`: a RLS
 * já libera o dono da inscrição e evita depender de coluna nova nos tipos
 * do frontend. O polling é simples de propósito — realtime exigiria
 * publicar a tabela, o que é decisão da Fase 5.
 */
const PaymentWatcher = ({
  registrationId, onConfirmed,
}: { registrationId: string; onConfirmed: () => void }) => {
  const [attempts, setAttempts] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("event_registrations")
        .select("status")
        .eq("id", registrationId)
        .maybeSingle();

      if (cancelled) return;

      if (data?.status === "confirmed") {
        doneRef.current = true;
        onConfirmed();
        return;
      }
      setAttempts((a) => a + 1);
    }, POLL_INTERVAL_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [registrationId, attempts, onConfirmed]);

  if (attempts >= POLL_MAX_ATTEMPTS) {
    return (
      <p className="text-center text-xs text-slate-500">
        Ainda não identificamos o pagamento. Assim que ele cair, sua inscrição é confirmada
        automaticamente — pode fechar esta janela.
      </p>
    );
  }

  return (
    <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando a confirmação do pagamento…
    </p>
  );
};

export default AsaasCheckoutModal;
