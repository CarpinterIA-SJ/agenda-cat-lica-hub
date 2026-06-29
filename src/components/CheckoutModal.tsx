import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Ticket, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { ChargeSummary } from "@/components/ChargeSummary";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CheckoutModalProps {
  eventId: string;
  ticketId: string;
  quantity: number;
  ticketName?: string;
  couponCode?: string | null;
  /** Respostas dos campos personalizados, gravadas no registro pending (Fase B). */
  customFields?: Record<string, any>;
  onClose: () => void;
}

interface CheckoutData {
  client_secret: string;
  payment_intent_id: string;
  subtotal: number;
  taxa: number;
  total: number;
  ticket_name: string;
}

export const CheckoutModal = ({
  eventId,
  ticketId,
  quantity,
  ticketName,
  couponCode,
  customFields,
  onClose,
}: CheckoutModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: platformSettings } = usePlatformSettings();
  const taxaPercent = Number(platformSettings?.map?.taxa_plataforma_percent ?? 5);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: fnErr } = await supabase.functions.invoke("stripe-checkout", {
          body: {
            event_id: eventId,
            ticket_id: ticketId,
            quantity,
            user_id: user?.id ?? null,
            coupon_code: couponCode ?? null,
            custom_fields: customFields ?? {},
          },
        });
        if (fnErr) {
          // Erro não-2xx: extrai a mensagem amigável do corpo (ex: valor_minimo,
          // opção esgotada) em vez do genérico "non-2xx status code".
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
        if (!cancelled) setData(res as CheckoutData);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Falha ao iniciar o pagamento.");
          toast({ title: "Erro no checkout", description: e.message, variant: "destructive" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [eventId, ticketId, quantity, couponCode, user?.id, toast]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="
          flex flex-col gap-0 overflow-hidden p-0
          w-screen h-[100dvh] max-w-none rounded-none
          sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl
        "
      >
        {/* Header fixo */}
        <DialogHeader className="shrink-0 space-y-1 bg-[#004d00] p-4 text-left sm:p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <Ticket className="h-5 w-5" /> Finalizar inscrição
          </DialogTitle>
          <DialogDescription className="text-emerald-100">
            {ticketName ?? data?.ticket_name ?? "Ingresso"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#004d00]" />
          </div>
        ) : error ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
          </div>
        ) : data ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret: data.client_secret,
              appearance: { theme: "stripe", variables: { colorPrimary: "#004d00" } },
            }}
          >
            <PaymentForm data={data} taxaPercent={taxaPercent} onClose={onClose} />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

interface PaymentFormProps {
  data: CheckoutData;
  taxaPercent: number;
  onClose: () => void;
}

const PaymentForm = ({ data, taxaPercent, onClose }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/participante/meus-ingressos`,
      },
    });
    // Só chega aqui em caso de erro imediato (cartão). Boleto redireciona.
    if (error) {
      toast({ title: "Pagamento não concluído", description: error.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    // Form é o container flex que divide corpo rolável e rodapé fixo.
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {/* Corpo com scroll interno */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
        <ChargeSummary
          subtotalCents={data.subtotal}
          taxaCents={data.taxa}
          totalCents={data.total}
          taxaPercent={data.subtotal > 0 ? taxaPercent : undefined}
        />

        <PaymentElement />

        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Pagamento seguro processado pela Stripe
        </p>
      </div>

      {/* Rodapé fixo — botão Pagar sempre visível */}
      <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white p-4">
        <Button
          type="submit"
          className="h-12 w-full bg-[#004d00] text-base font-semibold text-white hover:bg-[#003a00]"
          disabled={!stripe || submitting}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : `Pagar ${brl(data.total)}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-9 w-full text-slate-500"
          onClick={onClose}
          disabled={submitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default CheckoutModal;
