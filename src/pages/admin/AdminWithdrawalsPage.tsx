import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Banknote, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  WithdrawalRequestWithOrg,
  useUpdateWithdrawalStatus,
  useWithdrawalRequests,
} from "@/hooks/use-withdrawal-requests";
import { useCreateAuditLog, type AuditLogAction } from "@/hooks/use-audit-log";
import { WithdrawalStatus } from "@/integrations/supabase/types";

const WITHDRAWAL_ACTION_BY_STATUS: Partial<Record<WithdrawalStatus, AuditLogAction>> = {
  approved: "APROVAR_REPASSE",
  paid: "PAGAR_REPASSE",
  rejected: "REJEITAR_REPASSE",
};

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  rejected: "Rejeitado",
};

const STATUS_BADGE: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminWithdrawalsPage = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "todos">("todos");
  const { data: requests, isLoading } = useWithdrawalRequests(
    statusFilter === "todos" ? undefined : { status: statusFilter },
  );
  const updateStatus = useUpdateWithdrawalStatus();
  const createAuditLog = useCreateAuditLog();

  const [payTarget, setPayTarget] = useState<WithdrawalRequestWithOrg | null>(null);
  const [rejectTarget, setRejectTarget] = useState<WithdrawalRequestWithOrg | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Totais por status (sobre o conjunto completo, ignorando o filtro de tabela).
  const { data: allRequests } = useWithdrawalRequests();
  const totals = useMemo(() => {
    return (allRequests ?? []).reduce(
      (acc, r) => {
        if (r.status === "pending") acc.pendente += r.amount_cents;
        if (r.status === "approved") acc.aprovado += r.amount_cents;
        if (r.status === "paid") acc.pago += r.amount_cents;
        return acc;
      },
      { pendente: 0, aprovado: 0, pago: 0 },
    );
  }, [allRequests]);

  const apply = (
    r: WithdrawalRequestWithOrg,
    status: WithdrawalStatus,
    admin_notes?: string,
  ) => {
    updateStatus.mutate(
      { id: r.id, status, admin_notes },
      {
        onSuccess: () => {
          toast({
            title: `Repasse ${STATUS_LABEL[status].toLowerCase()}`,
            description: r.organization?.name ?? fmtBRL(r.amount_cents),
          });
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
        onError: (e: any) => {
          toast({
            title: "Erro ao atualizar repasse",
            description: e?.message ?? "Tente novamente.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const confirmPay = () => {
    if (!payTarget) return;
    apply(payTarget, "paid");
    setPayTarget(null);
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectNotes.trim()) return;
    apply(rejectTarget, "rejected", rejectNotes.trim());
    setRejectTarget(null);
    setRejectNotes("");
  };

  const summaryCards = [
    { label: "Total pendente", value: totals.pendente, cls: "text-amber-700" },
    { label: "Total aprovado", value: totals.aprovado, cls: "text-blue-700" },
    { label: "Total pago", value: totals.pago, cls: "text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-[#004d00]" />
          Gestão de Repasses
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Aprove, rejeite ou marque como pagos os repasses solicitados pelos organizadores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {summaryCards.map((c) => (
          <Card key={c.label} className="border-slate-200 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className={`text-lg font-bold ${c.cls}`}>{fmtBRL(c.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as WithdrawalStatus | "todos")}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
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
                  <TableHead>Organizador</TableHead>
                  <TableHead>Valor solicitado</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Titular</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isLoading &&
                  (requests ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.organization?.name ?? "—"}</TableCell>
                      <TableCell className="text-slate-900 font-semibold">
                        {fmtBRL(r.amount_cents)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {r.bank_name || "—"}
                        {r.bank_agency || r.bank_account ? (
                          <span className="block text-xs text-slate-400">
                            {[r.bank_agency && `Ag ${r.bank_agency}`, r.bank_account && `C ${r.bank_account}`]
                              .filter(Boolean)
                              .join(" / ")}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-slate-600">{r.bank_holder || "—"}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {r.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-700 hover:text-emerald-800"
                                title="Aprovar"
                                disabled={updateStatus.isPending}
                                onClick={() => apply(r, "approved")}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700"
                                title="Rejeitar"
                                disabled={updateStatus.isPending}
                                onClick={() => {
                                  setRejectNotes("");
                                  setRejectTarget(r);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-700 hover:text-emerald-800"
                              title="Marcar como pago"
                              disabled={updateStatus.isPending}
                              onClick={() => setPayTarget(r)}
                            >
                              <Banknote className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && (requests ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      Nenhum repasse encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Marcar como pago — confirmação */}
      <AlertDialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar repasse como pago?</AlertDialogTitle>
            <AlertDialogDescription>
              {payTarget &&
                `Confirma o pagamento de ${fmtBRL(payTarget.amount_cents)} para "${
                  payTarget.organization?.name ?? "organizador"
                }"? A data do pagamento será registrada agora.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPay} className="bg-[#004d00] hover:bg-[#003300]">
              Confirmar pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejeitar — observações obrigatórias */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar repasse</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. Ficará registrado nas observações administrativas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-notes">Observações</Label>
            <Textarea
              id="reject-notes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Ex: dados bancários divergentes, saldo insuficiente..."
              rows={4}
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectNotes.trim() || updateStatus.isPending}
              onClick={confirmReject}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalsPage;
