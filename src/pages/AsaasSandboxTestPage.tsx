// ============================================================
//  Rota de teste do checkout Asaas — /teste/asaas
//
//  Existe só para exercitar o AsaasCheckoutModal isoladamente na
//  Fase 2, sem tocar no fluxo de inscrição (que segue no Stripe).
//  Deve ser REMOVIDA na Fase 5, junto com a troca definitiva.
//
//  ATENÇÃO: o sandbox do Asaas grava no banco de PRODUÇÃO do Supabase.
//  Use um evento de teste (status 'draft') e limpe as linhas depois —
//  o roteiro de limpeza está no relatório da Fase 2.
// ============================================================
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, FlaskConical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AsaasCheckoutModal } from "@/components/AsaasCheckoutModal";

interface EventRow { id: string; name: string; status: string }
interface TicketRow { id: string; name: string; price_cents: number; event_id: string }

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const AsaasSandboxTestPage = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [ticketId, setTicketId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [manualEventId, setManualEventId] = useState("");
  const [manualTicketId, setManualTicketId] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, status")
        .order("created_at", { ascending: false })
        .limit(50);
      setEvents((data as EventRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!eventId) { setTickets([]); setTicketId(""); return; }
    (async () => {
      const { data } = await supabase
        .from("event_tickets")
        .select("id, name, price_cents, event_id")
        .eq("event_id", eventId);
      setTickets((data as TicketRow[]) ?? []);
      setTicketId("");
    })();
  }, [eventId]);

  const selectedTicket = tickets.find((t) => t.id === ticketId);

  // Os selects dependem da RLS de `events`, que só lista rascunho para quem é
  // owner/admin em organization_members. Quem tem a org só pela coluna de dono
  // (sem a linha em organization_members) não vê o próprio draft — por isso o
  // modo manual, que não depende de listagem: o checkout roda em service_role.
  const effectiveEventId = manualEventId.trim() || eventId;
  const effectiveTicketId = manualTicketId.trim() || ticketId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-6 w-6 text-[#004d00]" />
        <h1 className="text-2xl font-bold">Teste do checkout Asaas</h1>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-1 text-sm text-amber-900">
          <p className="font-semibold">Página temporária da Fase 2.</p>
          <p>
            O fluxo real de inscrição continua no Stripe e não foi alterado. As cobranças
            criadas aqui vão para o <strong>sandbox do Asaas</strong>, mas as inscrições e
            pagamentos são gravados no <strong>banco de produção</strong> — use um evento de
            teste e limpe os registros depois.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parâmetros da cobrança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#004d00]" />
          ) : (
            <>
              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger><SelectValue placeholder="Escolha um evento" /></SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} <span className="text-xs text-slate-400">({e.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ingresso</Label>
                <Select value={ticketId} onValueChange={setTicketId} disabled={!tickets.length}>
                  <SelectTrigger>
                    <SelectValue placeholder={tickets.length ? "Escolha um ingresso" : "Selecione um evento primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tickets.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {brl(t.price_cents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Select value={String(quantity)} onValueChange={(v) => setQuantity(Number(v))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTicket && (
                <p className="text-sm text-slate-500">
                  Subtotal estimado: <strong>{brl(selectedTicket.price_cents * quantity)}</strong>{" "}
                  (a taxa da plataforma e o total final são calculados no servidor)
                </p>
              )}

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-600">
                  Modo manual — use quando o evento não aparecer na lista acima
                  (rascunho invisível pela RLS). Tem precedência sobre os selects.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Event ID</Label>
                  <Input
                    value={manualEventId}
                    onChange={(e) => setManualEventId(e.target.value)}
                    placeholder="uuid do evento"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ticket ID</Label>
                  <Input
                    value={manualTicketId}
                    onChange={(e) => setManualTicketId(e.target.value)}
                    placeholder="uuid do ingresso"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-[#004d00] hover:bg-[#003a00]"
                disabled={!effectiveEventId || !effectiveTicketId}
                onClick={() => setOpen(true)}
              >
                Abrir checkout Asaas
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {open && effectiveEventId && effectiveTicketId && (
        <AsaasCheckoutModal
          eventId={effectiveEventId}
          ticketId={effectiveTicketId}
          quantity={quantity}
          ticketName={selectedTicket?.name}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default AsaasSandboxTestPage;
