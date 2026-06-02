import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search, Eye, CheckCircle2, XCircle, Banknote, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";

type PayoutStatus = "Pendente" | "Aprovado" | "Pago" | "Rejeitado";

interface AdminPayout {
  id: string;
  organizador: string;
  evento: string;
  valor: number;
  metodo: "PIX" | "TED";
  chave: string;
  solicitadoEm: string;
  status: PayoutStatus;
}

const SEED: AdminPayout[] = [
  { id: "rp1", organizador: "Paróquia São José",      evento: "Retiro Pais e Filhos",      valor: 4250.0,  metodo: "PIX", chave: "12.345.678/0001-90", solicitadoEm: "2026-05-18", status: "Pago" },
  { id: "rp2", organizador: "Diocese de Aparecida",   evento: "Congresso da Família 2026", valor: 12800.5, metodo: "TED", chave: "Ag 0001 / C 12345-6", solicitadoEm: "2026-05-22", status: "Aprovado" },
  { id: "rp3", organizador: "Comunidade Canção Nova", evento: "Acampamento de Carnaval",   valor: 6300.0,  metodo: "PIX", chave: "eventos@cn.com.br",  solicitadoEm: "2026-05-26", status: "Pendente" },
  { id: "rp4", organizador: "Pastoral da Juventude",  evento: "Encontrão JOVEM 2026",      valor: 1980.75, metodo: "PIX", chave: "61999990000",        solicitadoEm: "2026-05-27", status: "Pendente" },
  { id: "rp5", organizador: "Ministério Adoradores",  evento: "Noite de Louvor",           valor: 850.0,   metodo: "PIX", chave: "11988887777",        solicitadoEm: "2026-05-10", status: "Rejeitado" },
];

const STATUS_BADGE: Record<PayoutStatus, string> = {
  Pendente:  "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Aprovado:  "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Pago:      "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Rejeitado: "bg-red-100 text-red-800 hover:bg-red-100",
};

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdminPayoutsPage = () => {
  const { toast } = useToast();
  const { log } = useAuditLog();
  const [items, setItems] = useState<AdminPayout[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "todos">("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<AdminPayout | null>(null);
  const [confirm, setConfirm] = useState<{ p: AdminPayout; next: PayoutStatus; label: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const hitsQ = !q || p.organizador.toLowerCase().includes(q) || p.evento.toLowerCase().includes(q);
      const hitsS = statusFilter === "todos" || p.status === statusFilter;
      const hitsFrom = !dateFrom || p.solicitadoEm >= dateFrom;
      const hitsTo = !dateTo || p.solicitadoEm <= dateTo;
      return hitsQ && hitsS && hitsFrom && hitsTo;
    });
  }, [items, search, statusFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, p) => {
        acc.total += p.valor;
        if (p.status === "Pendente") acc.pendente += p.valor;
        if (p.status === "Aprovado") acc.aprovado += p.valor;
        if (p.status === "Pago") acc.pago += p.valor;
        return acc;
      },
      { total: 0, pendente: 0, aprovado: 0, pago: 0 },
    );
  }, [filtered]);

  const apply = () => {
    if (!confirm) return;
    setItems((prev) => prev.map((p) => (p.id === confirm.p.id ? { ...p, status: confirm.next } : p)));
    toast({ title: `Repasse ${confirm.label.toLowerCase()}`, description: confirm.p.organizador });
    log({
      acao: confirm.label,
      tipo: "repasse",
      alvo: `${confirm.p.organizador} — ${fmtBRL(confirm.p.valor)}`,
      descricao: `Status do repasse alterado de "${confirm.p.status}" para "${confirm.next}".`,
    });
    setConfirm(null);
  };

  const actionsFor = (p: AdminPayout) => {
    const acts: { label: string; next: PayoutStatus; icon: React.ReactNode; cls: string }[] = [];
    if (p.status === "Pendente") {
      acts.push({ label: "Aprovado",  next: "Aprovado",  icon: <CheckCircle2 className="w-4 h-4" />, cls: "text-emerald-700 hover:text-emerald-800" });
      acts.push({ label: "Rejeitado", next: "Rejeitado", icon: <XCircle className="w-4 h-4" />,      cls: "text-red-600 hover:text-red-700" });
    } else if (p.status === "Aprovado") {
      acts.push({ label: "Pago", next: "Pago", icon: <Banknote className="w-4 h-4" />, cls: "text-emerald-700 hover:text-emerald-800" });
    }
    return acts;
  };

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total filtrado</p>
            <p className="text-lg font-bold text-slate-900">{fmtBRL(totals.total)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Pendente</p>
            <p className="text-lg font-bold text-amber-700">{fmtBRL(totals.pendente)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Aprovado</p>
            <p className="text-lg font-bold text-blue-700">{fmtBRL(totals.aprovado)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Pago</p>
            <p className="text-lg font-bold text-emerald-700">{fmtBRL(totals.pago)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por organizador ou evento"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PayoutStatus | "todos")}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full md:w-40"
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full md:w-40"
              aria-label="Data final"
            />
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Organizador</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.organizador}</TableCell>
                    <TableCell className="text-slate-600">{p.evento}</TableCell>
                    <TableCell className="text-slate-900 font-semibold">{fmtBRL(p.valor)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 text-slate-700">{p.metodo}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(p.solicitadoEm).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[p.status]}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(p)} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {actionsFor(p).map((a) => (
                          <Button
                            key={a.label}
                            variant="ghost"
                            size="icon"
                            className={a.cls}
                            title={a.label}
                            onClick={() => setConfirm({ p, next: a.next, label: a.label })}
                          >
                            {a.icon}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do repasse</DialogTitle>
            <DialogDescription>Dados financeiros e bancários da solicitação.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Organizador:</span> <b>{detail.organizador}</b></div>
              <div><span className="text-slate-500">Evento:</span> {detail.evento}</div>
              <div><span className="text-slate-500">Valor:</span> {fmtBRL(detail.valor)}</div>
              <div><span className="text-slate-500">Método:</span> {detail.metodo}</div>
              <div><span className="text-slate-500">Chave / Conta:</span> {detail.chave}</div>
              <div><span className="text-slate-500">Solicitado em:</span> {new Date(detail.solicitadoEm).toLocaleDateString("pt-BR")}</div>
              <div><span className="text-slate-500">Status:</span> {detail.status}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && `Repasse de ${fmtBRL(confirm.p.valor)} para "${confirm.p.organizador}" passará para "${confirm.next}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={apply} className="bg-[#004d00] hover:bg-[#003300]">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPayoutsPage;
