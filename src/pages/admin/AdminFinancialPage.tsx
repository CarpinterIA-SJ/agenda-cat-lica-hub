import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Search, CheckCircle2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RepasseStatus = "Pendente" | "Pago";

interface Repasse {
  id: string;
  organizador: string;
  valor: number;
  banco: string;
  dataSolicitacao: string;
  status: RepasseStatus;
}

const SEED: Repasse[] = [
  { id: "r1", organizador: "Paróquia São José", valor: 12450.75, banco: "Banco do Brasil - Ag 1234 / CC 567890-1", dataSolicitacao: "12/04/2026", status: "Pendente" },
  { id: "r2", organizador: "Comunidade Cristo Rei", valor: 3200.0, banco: "Caixa Econômica - Ag 4321 / Poup 000123-4", dataSolicitacao: "10/04/2026", status: "Pendente" },
  { id: "r3", organizador: "Diocese de Santos", valor: 8800.5, banco: "Bradesco - Ag 0987 / CC 445566-7", dataSolicitacao: "05/04/2026", status: "Pago" },
  { id: "r4", organizador: "PJ Diocesana", valor: 1560.0, banco: "Itaú - Ag 0055 / CC 998877-0", dataSolicitacao: "02/04/2026", status: "Pago" },
];

const AdminFinancialPage = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Repasse[]>(SEED);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Repasse | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.organizador.toLowerCase().includes(q));
  }, [items, search]);

  const totalPendente = items
    .filter((r) => r.status === "Pendente")
    .reduce((s, r) => s + r.valor, 0);
  const totalPago = items
    .filter((r) => r.status === "Pago")
    .reduce((s, r) => s + r.valor, 0);

  const confirmPay = () => {
    if (!target) return;
    setItems((prev) =>
      prev.map((r) => (r.id === target.id ? { ...r, status: "Pago" } : r)),
    );
    toast({ title: "Pagamento confirmado", description: target.organizador });
    setTarget(null);
  };

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financeiro Global</h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe solicitações de repasse dos organizadores.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 font-medium">Total Solicitado</p>
            <p className="text-2xl font-bold mt-2 text-slate-900">
              {formatBRL(totalPendente + totalPago)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 font-medium">Pendentes</p>
            <p className="text-2xl font-bold mt-2 text-amber-700">{formatBRL(totalPendente)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 font-medium">Pagos</p>
            <p className="text-2xl font-bold mt-2 text-emerald-700">{formatBRL(totalPago)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative max-w-sm flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por organizador"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Wallet className="w-4 h-4" />
              {items.filter((r) => r.status === "Pendente").length} solicitação(ões) pendente(s)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Organizador</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.organizador}</TableCell>
                    <TableCell className="font-medium">{formatBRL(r.valor)}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{r.banco}</TableCell>
                    <TableCell>{r.dataSolicitacao}</TableCell>
                    <TableCell>
                      {r.status === "Pendente" ? (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Pendente
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Pago
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pendente" ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 h-8"
                          onClick={() => setTarget(r)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar Pagamento
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhuma solicitação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Será registrado o repasse de {target && new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(target.valor)} para {target?.organizador}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPay}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFinancialPage;
