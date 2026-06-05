import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ClipboardList, Search } from "lucide-react";
import { useAuditLogs } from "@/hooks/use-audit-log";

// Rótulo legível e cor por ação registrada no banco.
const ACTION_LABEL: Record<string, string> = {
  APROVAR_ORGANIZADOR: "Aprovou organizador",
  REJEITAR_ORGANIZADOR: "Rejeitou organizador",
  SUSPENDER_ORGANIZADOR: "Suspendeu organizador",
  REATIVAR_ORGANIZADOR: "Reativou organizador",
  EDITAR_ORGANIZADOR: "Editou organizador",
  APROVAR_REPASSE: "Aprovou repasse",
  REJEITAR_REPASSE: "Rejeitou repasse",
  PAGAR_REPASSE: "Pagou repasse",
  ALTERAR_TAXA_PLATAFORMA: "Alterou taxa",
  ALTERAR_CONFIGURACOES: "Alterou configurações",
  SUSPENDER_USUARIO: "Suspendeu usuário",
  EDITAR_USUARIO: "Editou usuário",
};

const ACTION_BADGE: Record<string, string> = {
  APROVAR_ORGANIZADOR: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  REATIVAR_ORGANIZADOR: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  APROVAR_REPASSE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  PAGAR_REPASSE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  REJEITAR_ORGANIZADOR: "bg-red-100 text-red-800 hover:bg-red-100",
  REJEITAR_REPASSE: "bg-red-100 text-red-800 hover:bg-red-100",
  SUSPENDER_ORGANIZADOR: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  SUSPENDER_USUARIO: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  ALTERAR_TAXA_PLATAFORMA: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  ALTERAR_CONFIGURACOES: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  EDITAR_USUARIO: "bg-slate-200 text-slate-800 hover:bg-slate-200",
  EDITAR_ORGANIZADOR: "bg-slate-200 text-slate-800 hover:bg-slate-200",
};

const ENTITY_LABEL: Record<string, string> = {
  organization: "Organizador",
  withdrawal_request: "Repasse",
  user: "Usuário",
  platform_settings: "Configurações",
};

const actionLabel = (a: string) => ACTION_LABEL[a] ?? a;
const entityLabel = (t: string) => ENTITY_LABEL[t] ?? t;

// Transforma o JSON de details em texto curto e legível.
const formatDetails = (details: unknown): string => {
  if (!details || typeof details !== "object") return "—";
  const entries = Object.entries(details as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
};

const AdminAuditLogsPage = () => {
  const { data: logs = [], isLoading } = useAuditLogs({ limit: 500 });
  const [search, setSearch] = useState("");
  const [acaoFilter, setAcaoFilter] = useState<string>("todas");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const acoesDisponiveis = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      const detailsStr = formatDetails(l.details).toLowerCase();
      const hitsQ =
        !q ||
        (l.actor_email ?? "").toLowerCase().includes(q) ||
        actionLabel(l.action).toLowerCase().includes(q) ||
        entityLabel(l.entity_type).toLowerCase().includes(q) ||
        (l.entity_id ?? "").toLowerCase().includes(q) ||
        detailsStr.includes(q);
      const hitsA = acaoFilter === "todas" || l.action === acaoFilter;
      const dateOnly = l.created_at.slice(0, 10);
      const hitsFrom = !dateFrom || dateOnly >= dateFrom;
      const hitsTo = !dateTo || dateOnly <= dateTo;
      return hitsQ && hitsA && hitsFrom && hitsTo;
    });
  }, [logs, search, acaoFilter, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#004d00]" />
          Logs de Auditoria
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Histórico de ações administrativas registradas no servidor.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por administrador, ação ou detalhes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                maxLength={100}
              />
            </div>
            <Select value={acaoFilter} onValueChange={setAcaoFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                {acoesDisponiveis.map((a) => (
                  <SelectItem key={a} value={a}>{actionLabel(a)}</SelectItem>
                ))}
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
                  <TableHead>Administrador</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!isLoading &&
                  filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">
                        {l.actor_email ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={ACTION_BADGE[l.action] ?? "bg-slate-100 text-slate-800 hover:bg-slate-100"}>
                          {actionLabel(l.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-200 text-slate-700">
                          {entityLabel(l.entity_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs max-w-md">
                        {formatDetails(l.details)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
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
