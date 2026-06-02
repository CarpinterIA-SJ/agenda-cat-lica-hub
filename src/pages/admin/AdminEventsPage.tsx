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
import { Search, CheckCircle2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEvents, useUpdateEvent } from "@/hooks/use-events";

type EventStatus = "Aprovado" | "Aguardando Revisão" | "Finalizado";

interface AdminEvent {
  id: string;
  nome: string;
  organizador: string;
  data: string;
  totalVendido: number;
  status: EventStatus;
  destaque: boolean;
}

const statusColor: Record<EventStatus, string> = {
  Aprovado: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "Aguardando Revisão": "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Finalizado: "bg-slate-200 text-slate-700 hover:bg-slate-200",
};

const mapStatus = (s: string): EventStatus => {
  if (s === "active") return "Aprovado";
  if (s === "archived") return "Finalizado";
  return "Aguardando Revisão";
};

const AdminEventsPage = () => {
  const { toast } = useToast();
  const { data: rawEvents = [] } = useEvents();
  const updateEvent = useUpdateEvent();
  const [search, setSearch] = useState("");
  const [approveTarget, setApproveTarget] = useState<AdminEvent | null>(null);

  const events = useMemo<AdminEvent[]>(
    () =>
      rawEvents.map((e) => ({
        id: e.id,
        nome: e.name,
        organizador: "—",
        data: e.start_at ? new Date(e.start_at).toLocaleDateString("pt-BR") : "—",
        totalVendido: 0,
        status: mapStatus(e.status),
        destaque: false,
      })),
    [rawEvents]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.organizador.toLowerCase().includes(q),
    );
  }, [events, search]);

  const confirmApprove = async () => {
    if (!approveTarget) return;
    try {
      await updateEvent.mutateAsync({ id: approveTarget.id, status: "active" });
      toast({ title: "Evento aprovado", description: approveTarget.nome });
    } catch (e: any) {
      toast({ title: "Erro ao aprovar", description: e.message, variant: "destructive" });
    }
    setApproveTarget(null);
  };

  const toggleHighlight = (_id: string) => {
    toast({ title: "Destaque atualizado" });
  };

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestão de Eventos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Aprove e destaque os eventos cadastrados na plataforma.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por evento ou organizador"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Evento</TableHead>
                  <TableHead>Organizador</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Total Vendido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {e.destaque && (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        )}
                        {e.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{e.organizador}</TableCell>
                    <TableCell>{e.data}</TableCell>
                    <TableCell className="font-medium">{formatBRL(e.totalVendido)}</TableCell>
                    <TableCell>
                      <Badge className={statusColor[e.status]}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {e.status !== "Aprovado" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            onClick={() => setApproveTarget(e)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => toggleHighlight(e.id)}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          {e.destaque ? "Remover destaque" : "Destacar"}
                        </Button>
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

      <AlertDialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento {approveTarget?.nome} será publicado e ficará visível aos participantes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEventsPage;
