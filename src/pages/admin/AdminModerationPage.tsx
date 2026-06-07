import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  PauseCircle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  Users,
  MapPin,
  Tag,
  Ticket,
  Building2,
  Hourglass,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateAuditLog } from "@/hooks/use-audit-log";
import {
  useAdminModerationEvents,
  useModerateEvent,
  useModerationStats,
  toModerationState,
  ModerationEvent,
  ModerationState,
} from "@/hooks/use-admin-moderation";

type Tab = "pendente" | "aprovado" | "rejeitado" | "todos";

const STATE_LABEL: Record<ModerationState, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  suspenso: "Suspenso",
  rejeitado: "Rejeitado",
  finalizado: "Finalizado",
};

const STATE_BADGE: Record<ModerationState, string> = {
  pendente: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  aprovado: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  suspenso: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  rejeitado: "bg-red-100 text-red-800 hover:bg-red-100",
  finalizado: "bg-slate-200 text-slate-700 hover:bg-slate-200",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";
const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR") : "—";
const fmtBRL = (cents: number | null) =>
  cents === null
    ? "—"
    : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const locationLabel = (loc: any): string => {
  if (!loc) return "Local a definir";
  if (typeof loc === "string") return loc;
  return loc.address || loc.city || loc.name || "Local a definir";
};

interface ConfirmAction {
  event: ModerationEvent;
  action: "aprovar" | "suspender" | "reativar" | "reabrir";
}

const AdminModerationPage = () => {
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();
  const { data: events = [], isLoading } = useAdminModerationEvents();
  const { data: stats } = useModerationStats();
  const moderate = useModerateEvent();

  const [tab, setTab] = useState<Tab>("pendente");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [detail, setDetail] = useState<ModerationEvent | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ModerationEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Categorias reais presentes no banco (para o filtro).
  const categories = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.category).filter((c): c is string => !!c)),
      ).sort(),
    [events],
  );

  const pendingCount = useMemo(
    () => events.filter((e) => e.state === "pendente").length,
    [events],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const start = dateStart ? new Date(dateStart).getTime() : null;
    const end = dateEnd ? new Date(dateEnd).getTime() + 86_399_999 : null; // fim do dia
    return events.filter((e) => {
      if (tab !== "todos" && e.state !== tab) return false;
      if (
        q &&
        !e.name.toLowerCase().includes(q) &&
        !e.organizationName.toLowerCase().includes(q)
      )
        return false;
      if (category !== "all" && e.category !== category) return false;
      const submitted = new Date(e.createdAt).getTime();
      if (start !== null && submitted < start) return false;
      if (end !== null && submitted > end) return false;
      return true;
    });
  }, [events, tab, search, category, dateStart, dateEnd]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setDateStart("");
    setDateEnd("");
  };
  const hasFilters = !!search || category !== "all" || !!dateStart || !!dateEnd;

  // Histórico de status (audit logs) do evento aberto no painel lateral.
  const { data: history = [] } = useQuery({
    queryKey: ["event-audit", detail?.id],
    enabled: !!detail?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "event")
        .eq("entity_id", detail!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const runModeration = async (
    ev: ModerationEvent,
    status: ModerationEvent["status"],
    auditAction: string,
    reason?: string,
  ) => {
    try {
      await moderate.mutateAsync({ id: ev.id, status, rejection_reason: reason ?? null });
      await createAuditLog.mutateAsync({
        action: auditAction,
        entity_type: "event",
        entity_id: ev.id,
        details: {
          event_name: ev.name,
          organization: ev.organizationName,
          from_state: ev.state,
          to_state: toModerationState(status, reason ?? null),
          submitted_at: ev.createdAt,
          ...(reason ? { rejection_reason: reason } : {}),
        },
      });
      const label: Record<string, string> = {
        APROVAR_EVENTO: "Evento aprovado",
        REJEITAR_EVENTO: "Evento rejeitado",
        SUSPENDER_EVENTO: "Evento suspenso",
        REATIVAR_EVENTO: "Evento reativado",
        REABRIR_EVENTO: "Evento reaberto para revisão",
      };
      toast({ title: label[auditAction] ?? "Status atualizado", description: ev.name });
    } catch (e: any) {
      toast({ title: "Erro na moderação", description: e.message, variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { event, action } = confirm;
    setConfirm(null);
    if (action === "aprovar") await runModeration(event, "active", "APROVAR_EVENTO");
    if (action === "suspender") await runModeration(event, "paused", "SUSPENDER_EVENTO");
    if (action === "reativar") await runModeration(event, "active", "REATIVAR_EVENTO");
    if (action === "reabrir") await runModeration(event, "draft", "REABRIR_EVENTO");
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    const ev = rejectTarget;
    const reason = rejectReason.trim();
    setRejectTarget(null);
    setRejectReason("");
    await runModeration(ev, "archived", "REJEITAR_EVENTO", reason);
  };

  const confirmCopy: Record<ConfirmAction["action"], { title: string; desc: string; cls: string }> = {
    aprovar: {
      title: "Aprovar evento?",
      desc: "O evento ficará ativo e visível aos participantes.",
      cls: "bg-emerald-600 hover:bg-emerald-700",
    },
    suspender: {
      title: "Suspender evento?",
      desc: "O evento deixará de ficar visível até ser reativado.",
      cls: "bg-orange-600 hover:bg-orange-700",
    },
    reativar: {
      title: "Reativar evento?",
      desc: "O evento voltará a ficar ativo e visível aos participantes.",
      cls: "bg-emerald-600 hover:bg-emerald-700",
    },
    reabrir: {
      title: "Reabrir para revisão?",
      desc: "O evento voltará para a fila de pendentes (rascunho) e o motivo da rejeição será limpo.",
      cls: "bg-[#004d00] hover:bg-[#003300]",
    },
  };

  const STAT_CARDS = [
    { label: "Pendentes", value: String(stats?.pending ?? 0), icon: Hourglass, color: "text-amber-700", bg: "bg-amber-50" },
    { label: "Aprovados hoje", value: String(stats?.approvedToday ?? 0), icon: CheckSquare, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Rejeitados hoje", value: String(stats?.rejectedToday ?? 0), icon: XSquare, color: "text-red-700", bg: "bg-red-50" },
    {
      label: "Tempo médio de aprovação",
      value: stats?.avgApprovalHours != null ? `${stats.avgApprovalHours}h` : "—",
      icon: Clock,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#004d00]" />
          Moderação de Eventos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Aprove, rejeite ou suspenda eventos enviados pelos organizadores.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((m) => (
          <Card key={m.label} className="border-slate-200 rounded-2xl">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          {/* Abas */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-transparent p-0 h-auto gap-6 border-b border-slate-200 w-full justify-start rounded-none">
              <TabsTrigger value="pendente" className="px-0 pb-3 data-[state=active]:text-[#004d00] data-[state=active]:border-b-2 data-[state=active]:border-[#004d00] rounded-none gap-2">
                Pendentes
                {pendingCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="aprovado" className="px-0 pb-3 data-[state=active]:text-[#004d00] data-[state=active]:border-b-2 data-[state=active]:border-[#004d00] rounded-none">
                Aprovados
              </TabsTrigger>
              <TabsTrigger value="rejeitado" className="px-0 pb-3 data-[state=active]:text-[#004d00] data-[state=active]:border-b-2 data-[state=active]:border-[#004d00] rounded-none">
                Rejeitados
              </TabsTrigger>
              <TabsTrigger value="todos" className="px-0 pb-3 data-[state=active]:text-[#004d00] data-[state=active]:border-b-2 data-[state=active]:border-[#004d00] rounded-none">
                Todos
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filtros */}
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por evento ou organização"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full lg:w-52">
                <Tag className="w-4 h-4 mr-1 text-slate-400" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Submetido de</Label>
                <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-40" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">até</Label>
                <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-40" />
              </div>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="text-slate-500" onClick={clearFilters}>
                <XCircle className="w-4 h-4 mr-1" /> Limpar filtros
              </Button>
            )}
          </div>

          {/* Tabela */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Evento</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Data do evento</TableHead>
                  <TableHead>Submissão</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Capacidade</TableHead>
                  <TableHead className="text-right">Preço médio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => {
                  const urgent = e.state === "pendente" && e.submittedDaysAgo > 7;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {e.name}
                          {urgent && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
                              <AlertTriangle className="w-3 h-3" /> {e.submittedDaysAgo}d
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{locationLabel(e.location)}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">{e.organizationName}</TableCell>
                      <TableCell className="text-slate-600">{fmtDate(e.startAt)}</TableCell>
                      <TableCell className="text-slate-600">{fmtDate(e.createdAt)}</TableCell>
                      <TableCell className="text-slate-600">{e.category || "—"}</TableCell>
                      <TableCell className="text-right text-slate-600">
                        {e.capacity > 0 ? e.capacity.toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">{fmtBRL(e.avgPriceCents)}</TableCell>
                      <TableCell>
                        <Badge className={STATE_BADGE[e.state]}>{STATE_LABEL[e.state]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetail(e)} title="Ver detalhes">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {e.state === "pendente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-700 hover:text-emerald-800"
                                title="Aprovar"
                                onClick={() => setConfirm({ event: e, action: "aprovar" })}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                title="Rejeitar"
                                onClick={() => setRejectTarget(e)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {e.state === "aprovado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-orange-600 hover:text-orange-700"
                              title="Suspender"
                              onClick={() => setConfirm({ event: e, action: "suspender" })}
                            >
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {e.state === "suspenso" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-700 hover:text-emerald-800"
                              title="Reativar"
                              onClick={() => setConfirm({ event: e, action: "reativar" })}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          )}
                          {e.state === "rejeitado" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-blue-600 hover:text-blue-700"
                              title="Reabrir para revisão"
                              onClick={() => setConfirm({ event: e, action: "reabrir" })}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                      Carregando…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Painel lateral de detalhes */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="pr-6">{detail.name}</SheetTitle>
                <SheetDescription>Revise as informações antes de moderar.</SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge className={STATE_BADGE[detail.state]}>{STATE_LABEL[detail.state]}</Badge>
                  {detail.category && (
                    <Badge variant="outline" className="border-slate-200">{detail.category}</Badge>
                  )}
                  <Badge variant="outline" className="border-slate-200">{detail.format}</Badge>
                </div>

                {detail.bannerUrl && (
                  <img
                    src={detail.bannerUrl}
                    alt={detail.name}
                    className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
                  />
                )}

                <div className="grid grid-cols-1 gap-2">
                  <InfoRow icon={Building2} label="Organização" value={detail.organizationName} />
                  <InfoRow icon={Calendar} label="Data do evento" value={fmtDateTime(detail.startAt)} />
                  <InfoRow icon={Clock} label="Submetido em" value={fmtDateTime(detail.createdAt)} />
                  <InfoRow icon={MapPin} label="Local" value={locationLabel(detail.location)} />
                  <InfoRow
                    icon={Users}
                    label="Capacidade"
                    value={detail.capacity > 0 ? `${detail.capacity.toLocaleString("pt-BR")} ingressos` : "—"}
                  />
                  <InfoRow icon={Ticket} label="Preço médio" value={fmtBRL(detail.avgPriceCents)} />
                </div>

                {detail.rejectionReason && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Motivo da rejeição</p>
                    <p className="text-red-800">{detail.rejectionReason}</p>
                  </div>
                )}

                {detail.tickets.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Ingressos</p>
                    <div className="space-y-1">
                      {detail.tickets.map((t, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                          <span className="text-slate-700">{t.name}</span>
                          <span className="text-slate-500">
                            {t.quantity} un · {fmtBRL(t.price_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Descrição</p>
                  {detail.description ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.description) }}
                    />
                  ) : (
                    <p className="text-slate-700">{detail.descriptionText || "Sem descrição."}</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Histórico de status</p>
                  {history.length === 0 ? (
                    <p className="text-slate-400 text-xs">Nenhuma ação registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {(history as any[]).map((h) => (
                        <div key={h.id} className="flex items-start gap-2 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium text-slate-700">{h.action}</span>
                            <span className="text-slate-400"> · {fmtDateTime(h.created_at)}</span>
                            {h.actor_email && <span className="text-slate-400"> · {h.actor_email}</span>}
                            {h.details?.rejection_reason && (
                              <div className="text-slate-500">Motivo: {h.details.rejection_reason}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações rápidas no painel */}
                {detail.state === "pendente" && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => {
                        setRejectTarget(detail);
                        setDetail(null);
                      }}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setConfirm({ event: detail, action: "aprovar" });
                        setDetail(null);
                      }}
                    >
                      Aprovar
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirmação de aprovar/suspender/reativar/reabrir */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && confirmCopy[confirm.action].title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && (
                <>
                  {confirmCopy[confirm.action].desc}
                  <span className="block mt-2 font-medium text-slate-700">"{confirm.event.name}"</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirm ? confirmCopy[confirm.action].cls : ""}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de rejeição com motivo obrigatório */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar evento</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Ele ficará registrado e visível na revisão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo da rejeição *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex.: evento sem vínculo declarado com pastoral local."
              rows={4}
              maxLength={500}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim() || moderate.isPending}
              onClick={handleReject}
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-2 text-slate-700">
    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
    <span>
      <b>{label}:</b> {value}
    </span>
  </div>
);

export default AdminModerationPage;
