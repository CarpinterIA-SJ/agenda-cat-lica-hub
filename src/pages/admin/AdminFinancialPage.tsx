import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DollarSign,
  Landmark,
  Wallet,
  Banknote,
  Receipt,
  Search,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  Ticket,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  generateFinancialReport,
  generateEventReport,
  generateOrgReport,
  PdfTxRow,
} from "@/lib/pdf-export";
import {
  useAdminFinancialData,
  EnrichedPayment,
  AdminFinancialData,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_BADGE,
} from "@/hooks/use-admin-financial";
import {
  useWithdrawalRequests,
  useUpdateWithdrawalStatus,
  WithdrawalRequestWithOrg,
} from "@/hooks/use-withdrawal-requests";
import { useCreateAuditLog, type AuditLogAction } from "@/hooks/use-audit-log";
import {
  PaymentStatus,
  PaymentMethod,
  WithdrawalStatus,
} from "@/integrations/supabase/types";

// ─── Helpers ────────────────────────────────────────────────

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtBRL = (cents: number | null | undefined) => brl.format((cents ?? 0) / 100);
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR") : "—";

const sum = <T,>(arr: T[], pick: (t: T) => number) => arr.reduce((s, x) => s + (pick(x) || 0), 0);

type SortDir = "asc" | "desc";

// Mapeia um pagamento para a linha do PDF (mesma estrutura do CSV).
const toPdfTx = (p: EnrichedPayment): PdfTxRow => ({
  eventName: p.eventName,
  organizationName: p.organizationName,
  participantName: p.participantName,
  date: p.paid_at ?? p.created_at,
  amountCents: p.amount_cents,
  feeCents: p.fee_cents,
  netCents: p.net_cents,
  method: PAYMENT_METHOD_LABEL[p.method],
  status: PAYMENT_STATUS_LABEL[p.status],
});

// Estado de loading + geração assíncrona (deixa o spinner renderizar antes).
const usePdfExport = () => {
  const [loading, setLoading] = useState(false);
  const run = async (fn: () => void) => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 30));
      fn();
    } finally {
      setLoading(false);
    }
  };
  return { loading, run };
};

// ============================================================
//  Página
// ============================================================

const AdminFinancialPage = () => {
  const { data, isLoading } = useAdminFinancialData();
  const { data: withdrawals = [] } = useWithdrawalRequests();
  const { user } = useAuth();
  const adminName =
    (user?.user_metadata?.full_name as string) || user?.email || "Administrador";
  const [tab, setTab] = useState("visao-geral");

  const empty: AdminFinancialData = { payments: [], tickets: [], events: [], organizations: [] };
  const fin = data ?? empty;
  const paid = useMemo(() => fin.payments.filter((p) => p.status === "paid"), [fin.payments]);

  // Total já repassado = saques pagos.
  const totalRepassado = useMemo(
    () => sum(withdrawals.filter((w) => w.status === "paid"), (w) => w.amount_cents),
    [withdrawals],
  );

  const summary = useMemo(() => {
    const volume = sum(paid, (p) => p.amount_cents);
    const taxa = sum(paid, (p) => p.fee_cents);
    const net = sum(paid, (p) => p.net_cents);
    const ticketMedio = paid.length ? Math.round(volume / paid.length) : 0;
    return {
      volume,
      taxa,
      aRepassar: Math.max(net - totalRepassado, 0),
      repassado: totalRepassado,
      ticketMedio,
    };
  }, [paid, totalRepassado]);

  const cards = [
    { label: "Volume processado", value: fmtBRL(summary.volume), icon: DollarSign, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Taxa da plataforma", value: fmtBRL(summary.taxa), icon: Landmark, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "A repassar", value: fmtBRL(summary.aRepassar), icon: Wallet, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Total repassado", value: fmtBRL(summary.repassado), icon: Banknote, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Ticket médio", value: fmtBRL(summary.ticketMedio), icon: Receipt, color: "text-slate-700", bg: "bg-slate-100" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-[#004d00]" />
          Financeiro Global
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Volume processado, taxas, transações e repasses da plataforma.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((m) => (
          <Card key={m.label} className="border-slate-200 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold mt-2 ${m.color}`}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-slate-200 w-full justify-start rounded-none">
          {[
            { v: "visao-geral", l: "Visão geral" },
            { v: "por-evento", l: "Por evento" },
            { v: "por-organizacao", l: "Por organização" },
            { v: "saques", l: "Saques" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="px-0 pb-3 data-[state=active]:text-[#004d00] data-[state=active]:border-b-2 data-[state=active]:border-[#004d00] rounded-none"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "visao-geral" && (
        <OverviewTab paid={paid} all={fin.payments} isLoading={isLoading} summary={summary} adminName={adminName} />
      )}
      {tab === "por-evento" && <EventRevenueTab fin={fin} paid={paid} adminName={adminName} />}
      {tab === "por-organizacao" && (
        <OrgRevenueTab fin={fin} paid={paid} withdrawals={withdrawals} adminName={adminName} />
      )}
      {tab === "saques" && <SaquesTab />}
    </div>
  );
};

// ============================================================
//  Visão geral: gráfico + transações
// ============================================================

type Granularity = "dia" | "semana" | "mes";
type RangePreset = "7" | "30" | "90" | "ano" | "custom";

const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // segunda = 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};

const OverviewTab = ({
  paid,
  all,
  isLoading,
  summary,
  adminName,
}: {
  paid: EnrichedPayment[];
  all: EnrichedPayment[];
  isLoading: boolean;
  summary: { volume: number; taxa: number; aRepassar: number; repassado: number; ticketMedio: number };
  adminName: string;
}) => {
  const { toast } = useToast();
  const pdf = usePdfExport();
  const [gran, setGran] = useState<Granularity>("dia");
  const [range, setRange] = useState<RangePreset>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "todos">("todos");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "todos">("todos");
  const [page, setPage] = useState(0);

  const { start, end } = useMemo(() => {
    const now = new Date();
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    if (range === "custom") {
      return {
        start: customStart ? new Date(customStart) : new Date(0),
        end: customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : e,
      };
    }
    if (range === "ano") return { start: new Date(now.getFullYear(), 0, 1), end: e };
    const days = Number(range);
    const s = new Date(now);
    s.setDate(s.getDate() - (days - 1));
    s.setHours(0, 0, 0, 0);
    return { start: s, end: e };
  }, [range, customStart, customEnd]);

  const chartData = useMemo(() => {
    const buckets = new Map<number, { label: string; valor: number }>();
    paid.forEach((p) => {
      const dt = new Date(p.paid_at ?? p.created_at);
      if (dt < start || dt > end) return;
      let key: Date;
      let label: string;
      if (gran === "dia") {
        key = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        label = key.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      } else if (gran === "semana") {
        key = startOfWeek(dt);
        label = key.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      } else {
        key = new Date(dt.getFullYear(), dt.getMonth(), 1);
        label = key.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      }
      const k = key.getTime();
      const cur = buckets.get(k) ?? { label, valor: 0 };
      cur.valor += p.amount_cents / 100;
      buckets.set(k, cur);
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }, [paid, start, end, gran]);

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((p) => {
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      if (methodFilter !== "todos" && p.method !== methodFilter) return false;
      if (
        q &&
        !p.eventName.toLowerCase().includes(q) &&
        !p.organizationName.toLowerCase().includes(q) &&
        !p.participantName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [all, search, statusFilter, methodFilter]);

  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredTx.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filteredTx.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const exportCsv = () => {
    const header = [
      "Evento", "Organizacao", "Participante", "Data",
      "Valor bruto", "Taxa", "Valor liquido", "Metodo", "Status",
    ];
    const cell = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = filteredTx.map((p) =>
      [
        p.eventName, p.organizationName, p.participantName,
        fmtDateTime(p.paid_at ?? p.created_at),
        (p.amount_cents / 100).toFixed(2),
        (p.fee_cents / 100).toFixed(2),
        (p.net_cents / 100).toFixed(2),
        PAYMENT_METHOD_LABEL[p.method],
        PAYMENT_STATUS_LABEL[p.status],
      ].map(cell).join(","),
    );
    const csv = [header.map(cell).join(","), ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exportado", description: `${filteredTx.length} transações.` });
  };

  const periodLabel = useMemo(() => {
    if (range === "custom") {
      const f = (s: string) => (s ? new Date(s).toLocaleDateString("pt-BR") : "…");
      return customStart || customEnd ? `${f(customStart)} a ${f(customEnd)}` : "Período completo";
    }
    return {
      "7": "Últimos 7 dias",
      "30": "Últimos 30 dias",
      "90": "Últimos 90 dias",
      ano: "Ano corrente",
    }[range];
  }, [range, customStart, customEnd]);

  const exportPdf = () =>
    pdf.run(() =>
      generateFinancialReport({
        generatedBy: adminName,
        periodLabel,
        summary,
        transactions: filteredTx.map(toPdfTx),
      }),
    );

  return (
    <div className="space-y-6">
      {/* Gráfico */}
      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Receita por período</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={gran} onValueChange={(v) => setGran(v as Granularity)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Diário</SelectItem>
                  <SelectItem value="semana">Semanal</SelectItem>
                  <SelectItem value="mes">Mensal</SelectItem>
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="ano">Ano corrente</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>
              {range === "custom" && (
                <>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
                </>
              )}
            </div>
          </div>
          <div className="h-72">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                {isLoading ? "Carregando…" : "Sem receita no período."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <RechartsTooltip formatter={(v: number) => brl.format(v)} />
                  <Bar dataKey="valor" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transações */}
      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por evento, organização ou participante"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(0); }}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="paid">Confirmado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="refunded">Estornado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v as any); setPage(0); }}>
              <SelectTrigger className="w-full lg:w-40"><SelectValue placeholder="Método" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os métodos</SelectItem>
                <SelectItem value="credit_card">Cartão</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={filteredTx.length === 0} className="gap-2">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={filteredTx.length === 0 || pdf.loading} className="gap-2">
              {pdf.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Exportar PDF
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Evento</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Participante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.eventName}</TableCell>
                    <TableCell className="text-slate-600">{p.organizationName}</TableCell>
                    <TableCell className="text-slate-600">{p.participantName}</TableCell>
                    <TableCell className="text-slate-600">{fmtDate(p.paid_at ?? p.created_at)}</TableCell>
                    <TableCell className="text-right">{fmtBRL(p.amount_cents)}</TableCell>
                    <TableCell className="text-right text-amber-700">{fmtBRL(p.fee_cents)}</TableCell>
                    <TableCell className="text-right text-emerald-700">{fmtBRL(p.net_cents)}</TableCell>
                    <TableCell className="text-slate-600">{PAYMENT_METHOD_LABEL[p.method]}</TableCell>
                    <TableCell>
                      <Badge className={PAYMENT_STATUS_BADGE[p.status]}>{PAYMENT_STATUS_LABEL[p.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredTx.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTx.length > pageSize && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filteredTx.length)} de {filteredTx.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span>{safePage + 1} / {pageCount}</span>
                <Button variant="outline" size="icon" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================
//  Receita por evento
// ============================================================

interface EventRow {
  eventId: string;
  eventName: string;
  organizationName: string;
  vendidos: number;
  bruta: number;
  taxa: number;
  liquida: number;
  capacity: number;
  ocupacao: number | null;
}

const EventRevenueTab = ({
  fin,
  paid,
  adminName,
}: {
  fin: AdminFinancialData;
  paid: EnrichedPayment[];
  adminName: string;
}) => {
  const pdf = usePdfExport();
  const [sortKey, setSortKey] = useState<keyof EventRow>("bruta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detail, setDetail] = useState<EventRow | null>(null);

  const exportEventPdf = (r: EventRow) =>
    pdf.run(() => {
      const meta = fin.events.find((e) => e.id === r.eventId);
      generateEventReport({
        generatedBy: adminName,
        event: {
          name: r.eventName,
          organizationName: r.organizationName,
          date: meta?.start_at ?? null,
          location: "—", // localização não carregada pela query (fora do escopo)
          capacity: r.capacity,
          vendidos: r.vendidos,
          ocupacao: r.ocupacao,
          bruta: r.bruta,
          taxa: r.taxa,
          liquida: r.liquida,
        },
        tickets: fin.tickets
          .filter((t) => t.event_id === r.eventId)
          .map((t) => ({ name: t.name, type: t.type, quantity: t.quantity, sold: t.sold, priceCents: t.price_cents })),
        transactions: fin.payments.filter((p) => p.event_id === r.eventId).map(toPdfTx),
      });
    });

  const capacityByEvent = useMemo(() => {
    const m = new Map<string, number>();
    fin.tickets.forEach((t) => m.set(t.event_id, (m.get(t.event_id) ?? 0) + (t.quantity ?? 0)));
    return m;
  }, [fin.tickets]);

  const rows = useMemo<EventRow[]>(() => {
    const m = new Map<string, EventRow>();
    paid.forEach((p) => {
      if (!p.event_id) return;
      const cur =
        m.get(p.event_id) ??
        {
          eventId: p.event_id,
          eventName: p.eventName,
          organizationName: p.organizationName,
          vendidos: 0,
          bruta: 0,
          taxa: 0,
          liquida: 0,
          capacity: capacityByEvent.get(p.event_id) ?? 0,
          ocupacao: null,
        };
      cur.vendidos += 1;
      cur.bruta += p.amount_cents;
      cur.taxa += p.fee_cents;
      cur.liquida += p.net_cents;
      m.set(p.event_id, cur);
    });
    const list = Array.from(m.values());
    list.forEach((r) => {
      r.ocupacao = r.capacity > 0 ? Math.round((r.vendidos / r.capacity) * 100) : null;
    });
    return list;
  }, [paid, capacityByEvent]);

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (k: keyof EventRow) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const detailTickets = useMemo(
    () => (detail ? fin.tickets.filter((t) => t.event_id === detail.eventId) : []),
    [detail, fin.tickets],
  );

  const SortHead = ({ k, label, right }: { k: keyof EventRow; label: string; right?: boolean }) => (
    <TableHead className={right ? "text-right" : ""}>
      <button className="inline-flex items-center gap-1 hover:text-slate-900" onClick={() => toggleSort(k)}>
        {label} <ArrowUpDown className="w-3 h-3" />
      </button>
    </TableHead>
  );

  return (
    <Card className="border-slate-200 rounded-2xl">
      <CardContent className="p-5">
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <SortHead k="eventName" label="Evento" />
                <SortHead k="organizationName" label="Organização" />
                <SortHead k="vendidos" label="Vendidos" right />
                <SortHead k="bruta" label="Receita bruta" right />
                <SortHead k="taxa" label="Taxa" right />
                <SortHead k="liquida" label="Líquida org" right />
                <SortHead k="ocupacao" label="% ocupação" right />
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.eventId} className="cursor-pointer" onClick={() => setDetail(r)}>
                  <TableCell className="font-medium">{r.eventName}</TableCell>
                  <TableCell className="text-slate-600">{r.organizationName}</TableCell>
                  <TableCell className="text-right">{r.vendidos}</TableCell>
                  <TableCell className="text-right">{fmtBRL(r.bruta)}</TableCell>
                  <TableCell className="text-right text-amber-700">{fmtBRL(r.taxa)}</TableCell>
                  <TableCell className="text-right text-emerald-700">{fmtBRL(r.liquida)}</TableCell>
                  <TableCell className="text-right">{r.ocupacao !== null ? `${r.ocupacao}%` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Exportar PDF do evento"
                      disabled={pdf.loading}
                      onClick={(e) => { e.stopPropagation(); exportEventPdf(r); }}
                    >
                      {pdf.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                    Nenhuma receita por evento ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{detail.eventName}</SheetTitle>
                <SheetDescription>{detail.organizationName}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Receita bruta" value={fmtBRL(detail.bruta)} cls="text-slate-900" />
                  <Metric label="Taxa plataforma" value={fmtBRL(detail.taxa)} cls="text-amber-700" />
                  <Metric label="Líquida org" value={fmtBRL(detail.liquida)} cls="text-emerald-700" />
                  <Metric label="Ingressos vendidos" value={String(detail.vendidos)} cls="text-slate-900" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Ingressos por tipo / lote</p>
                  {detailTickets.length === 0 ? (
                    <p className="text-slate-400 text-xs">Sem ingressos cadastrados.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailTickets.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <span className="text-slate-700">
                            {t.name} <span className="text-slate-400">· {t.type}</span>
                          </span>
                          <span className="text-slate-500">
                            {t.sold ?? 0}/{t.quantity ?? 0} · {fmtBRL(t.price_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <Button className="w-full gap-2 bg-[#004d00] hover:bg-[#003300]" disabled={pdf.loading}
                    onClick={() => exportEventPdf(detail)}>
                    {pdf.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Exportar PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
};

// ============================================================
//  Receita por organização
// ============================================================

interface OrgRow {
  orgId: string;
  orgName: string;
  eventosAtivos: number;
  arrecadado: number;
  taxaRetida: number;
  saldoDisponivel: number;
  totalSacado: number;
}

const OrgRevenueTab = ({
  fin,
  paid,
  withdrawals,
  adminName,
}: {
  fin: AdminFinancialData;
  paid: EnrichedPayment[];
  withdrawals: WithdrawalRequestWithOrg[];
  adminName: string;
}) => {
  const pdf = usePdfExport();
  const [sortKey, setSortKey] = useState<keyof OrgRow>("arrecadado");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [detail, setDetail] = useState<OrgRow | null>(null);

  const exportOrgPdf = (r: OrgRow) =>
    pdf.run(() => {
      // Eventos da org ranqueados por receita (a partir dos pagamentos pagos).
      const byEvent = new Map<string, { name: string; status: string; brutaCents: number; vendidos: number }>();
      paid
        .filter((p) => p.organization_id === r.orgId && p.event_id)
        .forEach((p) => {
          const meta = fin.events.find((e) => e.id === p.event_id);
          const cur = byEvent.get(p.event_id!) ?? { name: p.eventName, status: meta?.status ?? "—", brutaCents: 0, vendidos: 0 };
          cur.brutaCents += p.amount_cents;
          cur.vendidos += 1;
          byEvent.set(p.event_id!, cur);
        });
      const events = Array.from(byEvent.values()).sort((a, b) => b.brutaCents - a.brutaCents);
      generateOrgReport({
        generatedBy: adminName,
        org: {
          name: r.orgName,
          arrecadado: r.arrecadado,
          taxaRetida: r.taxaRetida,
          saldoDisponivel: r.saldoDisponivel,
          totalSacado: r.totalSacado,
        },
        events,
        withdrawals: withdrawals
          .filter((w) => w.organization_id === r.orgId)
          .map((w) => ({ date: w.created_at, amountCents: w.amount_cents, status: W_STATUS_LABEL[w.status] })),
      });
    });

  const sacadoByOrg = useMemo(() => {
    const m = new Map<string, number>();
    withdrawals
      .filter((w) => w.status === "paid")
      .forEach((w) => m.set(w.organization_id, (m.get(w.organization_id) ?? 0) + w.amount_cents));
    return m;
  }, [withdrawals]);

  const activeByOrg = useMemo(() => {
    const m = new Map<string, number>();
    fin.events
      .filter((e) => e.status === "active")
      .forEach((e) => m.set(e.organization_id, (m.get(e.organization_id) ?? 0) + 1));
    return m;
  }, [fin.events]);

  const orgNameById = useMemo(() => {
    const m = new Map<string, string>();
    fin.organizations.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [fin.organizations]);

  const rows = useMemo<OrgRow[]>(() => {
    const m = new Map<string, OrgRow>();
    paid.forEach((p) => {
      const id = p.organization_id;
      const cur =
        m.get(id) ??
        {
          orgId: id,
          orgName: orgNameById.get(id) ?? p.organizationName,
          eventosAtivos: activeByOrg.get(id) ?? 0,
          arrecadado: 0,
          taxaRetida: 0,
          saldoDisponivel: 0,
          totalSacado: sacadoByOrg.get(id) ?? 0,
        };
      cur.arrecadado += p.amount_cents;
      cur.taxaRetida += p.fee_cents;
      cur.saldoDisponivel += p.net_cents;
      m.set(id, cur);
    });
    const list = Array.from(m.values());
    list.forEach((r) => {
      r.saldoDisponivel = Math.max(r.saldoDisponivel - (sacadoByOrg.get(r.orgId) ?? 0), 0);
    });
    return list;
  }, [paid, orgNameById, activeByOrg, sacadoByOrg]);

  const sorted = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (k: keyof OrgRow) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const detailEvents = useMemo(
    () => (detail ? fin.events.filter((e) => e.organization_id === detail.orgId) : []),
    [detail, fin.events],
  );
  const detailWithdrawals = useMemo(
    () => (detail ? withdrawals.filter((w) => w.organization_id === detail.orgId) : []),
    [detail, withdrawals],
  );

  const SortHead = ({ k, label, right }: { k: keyof OrgRow; label: string; right?: boolean }) => (
    <TableHead className={right ? "text-right" : ""}>
      <button className="inline-flex items-center gap-1 hover:text-slate-900" onClick={() => toggleSort(k)}>
        {label} <ArrowUpDown className="w-3 h-3" />
      </button>
    </TableHead>
  );

  return (
    <Card className="border-slate-200 rounded-2xl">
      <CardContent className="p-5">
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <SortHead k="orgName" label="Organização" />
                <SortHead k="eventosAtivos" label="Eventos ativos" right />
                <SortHead k="arrecadado" label="Total arrecadado" right />
                <SortHead k="taxaRetida" label="Taxa retida" right />
                <SortHead k="saldoDisponivel" label="Saldo p/ saque" right />
                <SortHead k="totalSacado" label="Total sacado" right />
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.orgId} className="cursor-pointer" onClick={() => setDetail(r)}>
                  <TableCell className="font-medium">{r.orgName}</TableCell>
                  <TableCell className="text-right">{r.eventosAtivos}</TableCell>
                  <TableCell className="text-right">{fmtBRL(r.arrecadado)}</TableCell>
                  <TableCell className="text-right text-amber-700">{fmtBRL(r.taxaRetida)}</TableCell>
                  <TableCell className="text-right text-blue-700">{fmtBRL(r.saldoDisponivel)}</TableCell>
                  <TableCell className="text-right text-emerald-700">{fmtBRL(r.totalSacado)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Exportar PDF da organização"
                      disabled={pdf.loading}
                      onClick={(e) => { e.stopPropagation(); exportOrgPdf(r); }}
                    >
                      {pdf.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                    Nenhuma receita por organização ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-slate-400" /> {detail.orgName}
                </SheetTitle>
                <SheetDescription>Histórico de eventos e saques.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Arrecadado" value={fmtBRL(detail.arrecadado)} cls="text-slate-900" />
                  <Metric label="Taxa retida" value={fmtBRL(detail.taxaRetida)} cls="text-amber-700" />
                  <Metric label="Saldo p/ saque" value={fmtBRL(detail.saldoDisponivel)} cls="text-blue-700" />
                  <Metric label="Total sacado" value={fmtBRL(detail.totalSacado)} cls="text-emerald-700" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Eventos
                  </p>
                  {detailEvents.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhum evento.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailEvents.map((e) => (
                        <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <span className="text-slate-700">{e.name}</span>
                          <span className="text-xs text-slate-400">{e.status} · {fmtDate(e.start_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Saques
                  </p>
                  {detailWithdrawals.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhum saque.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailWithdrawals.map((w) => (
                        <div key={w.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <span className="text-slate-700">{fmtBRL(w.amount_cents)}</span>
                          <span className="text-xs text-slate-400">{w.status} · {fmtDate(w.created_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <Button className="w-full gap-2 bg-[#004d00] hover:bg-[#003300]" disabled={pdf.loading}
                    onClick={() => exportOrgPdf(detail)}>
                    {pdf.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Exportar PDF
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
};

const Metric = ({ label, value, cls }: { label: string; value: string; cls: string }) => (
  <div className="rounded-xl border border-slate-200 p-3">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`text-lg font-bold ${cls}`}>{value}</p>
  </div>
);

// ============================================================
//  Saques (reaproveita useWithdrawalRequests + audit)
// ============================================================

const WITHDRAWAL_ACTION_BY_STATUS: Partial<Record<WithdrawalStatus, AuditLogAction>> = {
  approved: "APROVAR_REPASSE",
  paid: "PAGAR_REPASSE",
  rejected: "REJEITAR_REPASSE",
};
const W_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pendente", approved: "Aprovado", paid: "Pago", rejected: "Rejeitado",
};
const W_STATUS_BADGE: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const SaquesTab = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "todos">("todos");
  const { data: requests = [], isLoading } = useWithdrawalRequests(
    statusFilter === "todos" ? undefined : { status: statusFilter },
  );
  const updateStatus = useUpdateWithdrawalStatus();
  const createAuditLog = useCreateAuditLog();

  const [payTarget, setPayTarget] = useState<WithdrawalRequestWithOrg | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequestWithOrg | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const apply = (r: WithdrawalRequestWithOrg, status: WithdrawalStatus, admin_notes?: string) => {
    updateStatus.mutate(
      { id: r.id, status, admin_notes },
      {
        onSuccess: () => {
          toast({ title: `Repasse ${W_STATUS_LABEL[status].toLowerCase()}`, description: r.organization?.name ?? fmtBRL(r.amount_cents) });
          const action = WITHDRAWAL_ACTION_BY_STATUS[status];
          if (action) {
            createAuditLog.mutate({
              action,
              entity_type: "withdrawal_request",
              entity_id: r.id,
              details: {
                valor: r.amount_cents,
                nome: r.organization?.name ?? null,
                ...(admin_notes ? { motivo: admin_notes } : {}),
              },
            });
          }
        },
        onError: (e: any) =>
          toast({ title: "Erro ao atualizar repasse", description: e?.message ?? "Tente novamente.", variant: "destructive" }),
      },
    );
  };

  return (
    <Card className="border-slate-200 rounded-2xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Organização</TableHead>
                <TableHead className="text-right">Valor solicitado</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Valor líquido</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.organization?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{fmtBRL(r.amount_cents)}</TableCell>
                  <TableCell className="text-right text-slate-400">—</TableCell>
                  <TableCell className="text-right text-slate-400">—</TableCell>
                  <TableCell className="text-slate-600">{fmtDate(r.created_at)}</TableCell>
                  <TableCell><Badge className={W_STATUS_BADGE[r.status]}>{W_STATUS_LABEL[r.status]}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="text-emerald-700 hover:text-emerald-800" title="Aprovar"
                            disabled={updateStatus.isPending} onClick={() => apply(r, "approved")}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" title="Rejeitar"
                            disabled={updateStatus.isPending} onClick={() => { setRejectNotes(""); setRejectTarget(r); }}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {r.status === "approved" && (
                        <Button variant="ghost" size="icon" className="text-emerald-700 hover:text-emerald-800" title="Marcar como pago"
                          disabled={updateStatus.isPending} onClick={() => setPayTarget(r)}>
                          <Banknote className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-8">Nenhum repasse encontrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar repasse como pago?</AlertDialogTitle>
            <AlertDialogDescription>
              {payTarget && `Confirma o pagamento de ${fmtBRL(payTarget.amount_cents)} para "${payTarget.organization?.name ?? "organizador"}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#004d00] hover:bg-[#003300]"
              onClick={() => { if (payTarget) { apply(payTarget, "paid"); setPayTarget(null); } }}
            >
              Confirmar pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectNotes(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar repasse</DialogTitle>
            <DialogDescription>Informe o motivo. Ficará nas observações administrativas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="w-reject">Observações</Label>
            <Textarea id="w-reject" value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={4} maxLength={500}
              placeholder="Ex: dados bancários divergentes, saldo insuficiente..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectNotes(""); }}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={!rejectNotes.trim() || updateStatus.isPending}
              onClick={() => { if (rejectTarget && rejectNotes.trim()) { apply(rejectTarget, "rejected", rejectNotes.trim()); setRejectTarget(null); setRejectNotes(""); } }}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminFinancialPage;
