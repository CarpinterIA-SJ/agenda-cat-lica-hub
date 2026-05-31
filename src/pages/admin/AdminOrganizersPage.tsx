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
import { Search, Eye, CheckCircle2, XCircle, Ban, RotateCcw, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";

type OrganizerStatus = "Pendente" | "Aprovado" | "Suspenso" | "Rejeitado";

interface AdminOrganizer {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  status: OrganizerStatus;
  createdAt: string;
}

const SEED: AdminOrganizer[] = [
  { id: "o1", nome: "Paróquia São José",        cnpj: "12.345.678/0001-90", email: "contato@saojose.org", telefone: "(31) 99999-1111", cidade: "Belo Horizonte/MG", status: "Pendente",  createdAt: "2026-05-20" },
  { id: "o2", nome: "Diocese de Aparecida",     cnpj: "23.456.789/0001-21", email: "eventos@aparecida.org", telefone: "(12) 98888-2222", cidade: "Aparecida/SP",     status: "Aprovado",  createdAt: "2026-04-10" },
  { id: "o3", nome: "Comunidade Canção Nova",   cnpj: "34.567.890/0001-32", email: "admin@cn.com.br",      telefone: "(12) 97777-3333", cidade: "Cachoeira Paulista/SP", status: "Aprovado", createdAt: "2026-03-02" },
  { id: "o4", nome: "Shalom BH",                cnpj: "45.678.901/0001-43", email: "bh@shalom.org",        telefone: "(31) 96666-4444", cidade: "Belo Horizonte/MG", status: "Suspenso",  createdAt: "2026-02-15" },
  { id: "o5", nome: "Pastoral da Juventude",    cnpj: "56.789.012/0001-54", email: "pj@cnbb.org.br",       telefone: "(61) 95555-5555", cidade: "Brasília/DF",       status: "Pendente",  createdAt: "2026-05-25" },
  { id: "o6", nome: "Ministério Adoradores",    cnpj: "67.890.123/0001-65", email: "contato@adoradores.com", telefone: "(11) 94444-6666", cidade: "São Paulo/SP",    status: "Rejeitado", createdAt: "2026-01-30" },
];

const STATUS_BADGE: Record<OrganizerStatus, string> = {
  Pendente:  "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Aprovado:  "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Suspenso:  "bg-orange-100 text-orange-800 hover:bg-orange-100",
  Rejeitado: "bg-red-100 text-red-800 hover:bg-red-100",
};

const AdminOrganizersPage = () => {
  const { toast } = useToast();
  const { log } = useAuditLog();
  const [items, setItems] = useState<AdminOrganizer[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | "todos">("todos");
  const [detail, setDetail] = useState<AdminOrganizer | null>(null);
  const [confirm, setConfirm] = useState<{ org: AdminOrganizer; next: OrganizerStatus; label: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((o) => {
      const hitsQ = !q || o.nome.toLowerCase().includes(q) || o.cnpj.includes(q) || o.email.toLowerCase().includes(q);
      const hitsS = statusFilter === "todos" || o.status === statusFilter;
      return hitsQ && hitsS;
    });
  }, [items, search, statusFilter]);

  const applyTransition = () => {
    if (!confirm) return;
    setItems((prev) => prev.map((o) => (o.id === confirm.org.id ? { ...o, status: confirm.next } : o)));
    toast({ title: confirm.label, description: confirm.org.nome });
    log({
      acao: confirm.label,
      tipo: "organizador",
      alvo: confirm.org.nome,
      descricao: `Status alterado de "${confirm.org.status}" para "${confirm.next}".`,
    });
    setConfirm(null);
  };

  const actionsFor = (o: AdminOrganizer) => {
    const acts: { label: string; next: OrganizerStatus; icon: React.ReactNode; cls: string }[] = [];
    if (o.status === "Pendente") {
      acts.push({ label: "Aprovado",  next: "Aprovado",  icon: <CheckCircle2 className="w-4 h-4" />, cls: "text-emerald-700 hover:text-emerald-800" });
      acts.push({ label: "Rejeitado", next: "Rejeitado", icon: <XCircle className="w-4 h-4" />,      cls: "text-red-600 hover:text-red-700" });
    } else if (o.status === "Aprovado") {
      acts.push({ label: "Suspenso", next: "Suspenso", icon: <Ban className="w-4 h-4" />, cls: "text-orange-600 hover:text-orange-700" });
    } else if (o.status === "Suspenso" || o.status === "Rejeitado") {
      acts.push({ label: "Reativado", next: "Aprovado", icon: <RotateCcw className="w-4 h-4" />, cls: "text-emerald-700 hover:text-emerald-800" });
    }
    return acts;
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
                placeholder="Buscar por nome, CNPJ ou e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrganizerStatus | "todos")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Organizador</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.nome}</TableCell>
                    <TableCell className="text-slate-600">{o.cnpj}</TableCell>
                    <TableCell className="text-slate-600">{o.email}</TableCell>
                    <TableCell className="text-slate-600">{o.cidade}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[o.status]}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(o)} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {actionsFor(o).map((a) => (
                          <Button
                            key={a.label}
                            variant="ghost"
                            size="icon"
                            className={a.cls}
                            title={a.label}
                            onClick={() => setConfirm({ org: o, next: a.next, label: a.label })}
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
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhum organizador encontrado.
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
            <DialogTitle>Detalhes do organizador</DialogTitle>
            <DialogDescription>Informações cadastrais e de contato.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Nome:</span> <b>{detail.nome}</b></div>
              <div><span className="text-slate-500">CNPJ:</span> {detail.cnpj}</div>
              <div><span className="text-slate-500">E-mail:</span> {detail.email}</div>
              <div><span className="text-slate-500">Telefone:</span> {detail.telefone}</div>
              <div><span className="text-slate-500">Cidade:</span> {detail.cidade}</div>
              <div><span className="text-slate-500">Status:</span> {detail.status}</div>
              <div><span className="text-slate-500">Cadastrado em:</span> {new Date(detail.createdAt).toLocaleDateString("pt-BR")}</div>
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
              {confirm && `O organizador "${confirm.org.nome}" passará para o status "${confirm.next}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={applyTransition} className="bg-[#004d00] hover:bg-[#003300]">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrganizersPage;
