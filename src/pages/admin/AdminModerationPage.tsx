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
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Star,
  StarOff,
  ShieldCheck,
  Calendar,
  MapPin,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";

type ModerationStatus = "Pendente" | "Aprovado" | "Rejeitado";

interface ModerationEvent {
  id: string;
  titulo: string;
  organizador: string;
  categoria: string;
  cidade: string;
  data: string;
  capacidade: number;
  descricao: string;
  status: ModerationStatus;
  destaque: boolean;
}

const SEED: ModerationEvent[] = [
  { id: "ev1", titulo: "Hallel Brasil 2026",                organizador: "Comunidade Canção Nova",   categoria: "Shows Católicos",            cidade: "Cachoeira Paulista/SP", data: "2026-08-15", capacidade: 25000, descricao: "Festival nacional de louvor e adoração.",                 status: "Pendente", destaque: false },
  { id: "ev2", titulo: "Retiro de Carnaval Adoradores",     organizador: "Ministério Adoradores",    categoria: "Retiros",                    cidade: "Aparecida/SP",          data: "2026-02-12", capacidade: 800,   descricao: "Retiro de carnaval com momentos de adoração e formação.", status: "Pendente", destaque: false },
  { id: "ev3", titulo: "Encontrão JOVEM 2026",              organizador: "Pastoral da Juventude",    categoria: "Encontros de Formação",      cidade: "Brasília/DF",           data: "2026-07-20", capacidade: 1500,  descricao: "Encontro de formação para jovens da PJ.",                  status: "Aprovado", destaque: true  },
  { id: "ev4", titulo: "Seminário SVES Paróquia São José",  organizador: "Paróquia São José",         categoria: "Seminário de Vida no Espírito Santo", cidade: "Belo Horizonte/MG", data: "2026-06-01", capacidade: 200, descricao: "Seminário de Vida no Espírito Santo aberto a toda comunidade.", status: "Pendente", destaque: false },
  { id: "ev5", titulo: "Show da Banda XYZ",                 organizador: "Promotor Independente",     categoria: "Shows Católicos",            cidade: "Recife/PE",             data: "2026-09-05", capacidade: 5000,  descricao: "Show pop sem vínculo declarado com pastoral local.",       status: "Rejeitado", destaque: false },
];

const STATUS_BADGE: Record<ModerationStatus, string> = {
  Pendente:  "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Aprovado:  "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Rejeitado: "bg-red-100 text-red-800 hover:bg-red-100",
};

const AdminModerationPage = () => {
  const { toast } = useToast();
  const { log } = useAuditLog();
  const [items, setItems] = useState<ModerationEvent[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "todos">("Pendente");
  const [detail, setDetail] = useState<ModerationEvent | null>(null);
  const [confirm, setConfirm] = useState<{ ev: ModerationEvent; next: ModerationStatus; label: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      const hitsQ = !q || e.titulo.toLowerCase().includes(q) || e.organizador.toLowerCase().includes(q);
      const hitsS = statusFilter === "todos" || e.status === statusFilter;
      return hitsQ && hitsS;
    });
  }, [items, search, statusFilter]);

  const apply = () => {
    if (!confirm) return;
    setItems((prev) => prev.map((e) => (e.id === confirm.ev.id ? { ...e, status: confirm.next } : e)));
    toast({ title: `Evento ${confirm.label.toLowerCase()}`, description: confirm.ev.titulo });
    log({
      acao: confirm.label,
      tipo: "evento",
      alvo: confirm.ev.titulo,
      descricao: `Moderação: status alterado de "${confirm.ev.status}" para "${confirm.next}".`,
    });
    setConfirm(null);
  };

  const toggleHighlight = (ev: ModerationEvent) => {
    const next = !ev.destaque;
    setItems((prev) => prev.map((e) => (e.id === ev.id ? { ...e, destaque: next } : e)));
    toast({
      title: next ? "Evento destacado na landing" : "Destaque removido",
      description: ev.titulo,
    });
    log({
      acao: next ? "Destacado" : "Removido",
      tipo: "evento",
      alvo: ev.titulo,
      descricao: next ? "Marcado como destaque na landing page." : "Removido dos destaques da landing.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#004d00]" />
          Moderação de Eventos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Aprove, rejeite ou destaque eventos publicados pelos organizadores.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por título ou organizador"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ModerationStatus | "todos")}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendente">Aguardando aprovação</SelectItem>
                <SelectItem value="Aprovado">Aprovados</SelectItem>
                <SelectItem value="Rejeitado">Rejeitados</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Evento</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        {e.titulo}
                        {e.destaque && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                            <Star className="w-3 h-3" /> Destaque
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{e.cidade}</div>
                    </TableCell>
                    <TableCell className="text-slate-600">{e.organizador}</TableCell>
                    <TableCell className="text-slate-600">{e.categoria}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(e.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[e.status]}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(e)} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {e.status === "Pendente" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-emerald-700 hover:text-emerald-800"
                              title="Aprovar"
                              onClick={() => setConfirm({ ev: e, next: "Aprovado", label: "Aprovado" })}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              title="Rejeitar"
                              onClick={() => setConfirm({ ev: e, next: "Rejeitado", label: "Rejeitado" })}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {e.status === "Aprovado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={e.destaque ? "text-amber-600 hover:text-amber-700" : "text-slate-500 hover:text-amber-600"}
                            title={e.destaque ? "Remover destaque" : "Destacar na landing"}
                            onClick={() => toggleHighlight(e)}
                          >
                            {e.destaque ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhum evento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.titulo}</DialogTitle>
            <DialogDescription>Revise os detalhes antes de aprovar ou rejeitar.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge className={STATUS_BADGE[detail.status]}>{detail.status}</Badge>
                <Badge variant="outline" className="border-slate-200">{detail.categoria}</Badge>
                {detail.destaque && (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
                    <Star className="w-3 h-3" /> Destaque
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span><b>Organizador:</b> {detail.organizador}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span><b>Data:</b> {new Date(detail.data).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span><b>Local:</b> {detail.cidade}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span><b>Capacidade:</b> {detail.capacidade.toLocaleString("pt-BR")} pessoas</span>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Descrição</p>
                <p className="text-slate-700">{detail.descricao}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {detail?.status === "Pendente" && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setConfirm({ ev: detail, next: "Rejeitado", label: "Rejeitado" });
                    setDetail(null);
                  }}
                >
                  Rejeitar
                </Button>
                <Button
                  className="bg-[#004d00] hover:bg-[#003300]"
                  onClick={() => {
                    setConfirm({ ev: detail, next: "Aprovado", label: "Aprovado" });
                    setDetail(null);
                  }}
                >
                  Aprovar
                </Button>
              </>
            )}
            {detail?.status !== "Pendente" && (
              <Button variant="outline" onClick={() => setDetail(null)}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar moderação?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && `O evento "${confirm.ev.titulo}" passará para o status "${confirm.next}".`}
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

export default AdminModerationPage;
