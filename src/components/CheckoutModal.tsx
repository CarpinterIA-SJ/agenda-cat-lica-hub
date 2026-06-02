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

interface CheckoutModalProps {
  eventId: string;
  ticketId: string;
  quantity: number;
  ticketName?: string;
  couponCode?: string | null;
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
          },
        });
        if (fnErr) throw fnErr;
        if (res?.error) throw new Error(res.error);
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
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <div className="bg-[#004d00] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Ticket className="w-5 h-5" /> Finalizar inscrição
            </DialogTitle>
            <DialogDescription className="text-emerald-100">
              {ticketName ?? data?.ticket_name ?? "Ingresso"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#004d00]" />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
            </div>
          ) : data ? (
            <>
              {/* Resumo de cobrança */}
              <ChargeSummary
                subtotalCents={data.subtotal}
                taxaCents={data.taxa}
                totalCents={data.total}
                taxaPercent={data.subtotal > 0 ? taxaPercent : undefined}
              />

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: data.client_secret,
                  appearance: { theme: "stripe", variables: { colorPrimary: "#004d00" } },
                }}
              >
                <PaymentForm onClose={onClose} />
              </Elements>

              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Pagamento seguro processado pela Stripe
              </p>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PaymentForm = ({ onClose }: { onClose: () => void }) => {
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
    // Só chega aqui em caso de erro imediato (cartão). PIX/boleto redirecionam.
    if (error) {
      toast({ title: "Pagamento não concluído", description: error.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#004d00] hover:bg-[#003a00] text-white"
          disabled={!stripe || submitting}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pagar agora"}
        </Button>
      </div>
    </form>
  );
};

export default CheckoutModal;
