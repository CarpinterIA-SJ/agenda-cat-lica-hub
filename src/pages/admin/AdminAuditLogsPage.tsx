import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ClipboardList, Search } from "lucide-react";
import { useAuditLog, type AuditTipo } from "@/hooks/use-audit-log";

const ACAO_BADGE: Record<string, string> = {
  Aprovado:   "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Reativado:  "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Pago:       "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  Destacado:  "bg-amber-100 text-amber-800 hover:bg-amber-100",
  Suspenso:   "bg-orange-100 text-orange-800 hover:bg-orange-100",
  Rejeitado:  "bg-red-100 text-red-800 hover:bg-red-100",
  Removido:   "bg-slate-200 text-slate-800 hover:bg-slate-200",
};

const TIPO_LABEL: Record<AuditTipo, string> = {
  organizador: "Organizador",
  repasse:     "Repasse",
  evento:      "Evento",
  outro:       "Outro",
};

const AdminAuditLogsPage = () => {
  const { entries } = useAuditLog();
  const [search, setSearch] = useState("");
  const [acaoFilter, setAcaoFilter] = useState<string>("todas");
  const [tipoFilter, setTipoFilter] = useState<AuditTipo | "todos">("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const acoesDisponiveis = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.acao))).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      const hitsQ = !q || e.alvo.toLowerCase().includes(q) || e.descricao.toLowerCase().includes(q) || e.usuario.toLowerCase().includes(q);
      const hitsA = acaoFilter === "todas" || e.acao === acaoFilter;
      const hitsT = tipoFilter === "todos" || e.tipo === tipoFilter;
      const dateOnly = e.data.slice(0, 10);
      const hitsFrom = !dateFrom || dateOnly >= dateFrom;
      const hitsTo = !dateTo || dateOnly <= dateTo;
      return hitsQ && hitsA && hitsT && hitsFrom && hitsTo;
    });
  }, [entries, search, acaoFilter, tipoFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#004d00]" />
          Logs de Auditoria
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Histórico de ações administrativas realizadas na plataforma.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por alvo, descrição ou usuário"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={acaoFilter} onValueChange={setAcaoFilter}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                {acoesDisponiveis.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as AuditTipo | "todos")}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="organizador">Organizador</SelectItem>
                <SelectItem value="repasse">Repasse</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
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
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {new Date(e.data).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">{e.usuario}</TableCell>
                    <TableCell>
                      <Badge className={ACAO_BADGE[e.acao] ?? "bg-slate-100 text-slate-800 hover:bg-slate-100"}>
                        {e.acao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {TIPO_LABEL[e.tipo as AuditTipo] ?? e.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-700">{e.alvo}</TableCell>
                    <TableCell className="text-slate-600">{e.descricao}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogsPage;
