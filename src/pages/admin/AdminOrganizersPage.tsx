import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, CheckCircle2, XCircle, Ban, RotateCcw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AdminOrganizer,
  useAdminOrganizers,
  useUpdateOrganizerStatus,
} from "@/hooks/use-admin-organizers";
import { useCreateAuditLog, type AuditLogAction } from "@/hooks/use-audit-log";
import { OrganizerStatus } from "@/integrations/supabase/types";

const ORG_ACTION_BY_STATUS: Record<OrganizerStatus, AuditLogAction> = {
  approved: "APROVAR_ORGANIZADOR",
  rejected: "REJEITAR_ORGANIZADOR",
  suspended: "SUSPENDER_ORGANIZADOR",
  pending: "EDITAR_ORGANIZADOR",
};

const STATUS_LABEL: Record<OrganizerStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  suspended: "Suspenso",
  rejected: "Rejeitado",
};

const STATUS_BADGE: Record<OrganizerStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  suspended: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const AdminOrganizersPage = () => {
  const { toast } = useToast();
  const { data: organizers, isLoading } = useAdminOrganizers();
  const updateStatus = useUpdateOrganizerStatus();
  const createAuditLog = useCreateAuditLog();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | "todos">("todos");
  const [suspendTarget, setSuspendTarget] = useState<AdminOrganizer | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminOrganizer | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (organizers ?? []).filter((o) => {
      const hitsQ = !q || o.name.toLowerCase().includes(q);
      const hitsS = statusFilter === "todos" || o.status === statusFilter;
      return hitsQ && hitsS;
    });
  }, [organizers, search, statusFilter]);

  const changeStatus = (
    o: AdminOrganizer,
    status: OrganizerStatus,
    reason?: string,
  ) => {
    updateStatus.mutate(
      { id: o.id, status, rejection_reason: reason },
      {
        onSuccess: () => {
          toast({ title: `Organizador ${STATUS_LABEL[status].toLowerCase()}`, description: o.name });
          // Log de auditoria (não bloqueia a ação principal em caso de falha).
          createAuditLog.mutate({
            action: ORG_ACTION_BY_STATUS[status],
            entity_type: "organization",
            entity_id: o.id,
            details: { nome: o.name, status, ...(reason ? { motivo: reason } : {}) },
          });
        },
        onError: (e: any) => {
          toast({
            title: "Erro ao atualizar status",
            description: e?.message ?? "Tente novamente.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    changeStatus(suspendTarget, "suspended");
    setSuspendTarget(null);
  };

  const confirmReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    changeStatus(rejectTarget, "rejected", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[#004d00]" />
          Gestão de Organizadores
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Aprove, rejeite ou suspenda contas de organizadores da plataforma.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nome"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as OrganizerStatus | "todos")}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-center">Eventos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
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
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="text-slate-600">{o.owner?.name ?? "—"}</TableCell>
                      <TableCell className="text-slate-600">{o.ownerEmail}</TableCell>
                      <TableCell className="text-center text-slate-600">{o.eventCount}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(o.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {o.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-emerald-700 hover:text-emerald-800"
                                title="Aprovar"
                                disabled={updateStatus.isPending}
                                onClick={() => changeStatus(o, "approved")}
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
                                  setRejectReason("");
                                  setRejectTarget(o);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {o.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-orange-600 hover:text-orange-700"
                              title="Suspender"
                              disabled={updateStatus.isPending}
                              onClick={() => setSuspendTarget(o)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {(o.status === "suspended" || o.status === "rejected") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-700 hover:text-emerald-800"
                              title="Reativar"
                              disabled={updateStatus.isPending}
                              onClick={() => changeStatus(o, "approved")}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      Nenhum organizador encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Suspender — confirmação */}
      <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender organizador?</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendTarget &&
                `"${suspendTarget.name}" deixará de operar na plataforma até ser reativado.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSuspend} className="bg-[#004d00] hover:bg-[#003300]">
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejeitar — motivo obrigatório */}
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
            <DialogTitle>Rejeitar organizador</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição{rejectTarget ? ` de "${rejectTarget.name}"` : ""}. Será
              registrado no cadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo da rejeição</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: documentação incompleta, CNPJ inválido..."
              rows={4}
              maxLength={500}
            />
          </div>
          <DialogFooter>
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
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectReason.trim() || updateStatus.isPending}
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

export default AdminOrganizersPage;
