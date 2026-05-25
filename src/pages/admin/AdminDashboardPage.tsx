import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShieldCheck, Users, Calendar, Wallet, AlertTriangle,
  MoreHorizontal, Search, Lock, UserPlus, UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/integrations/supabase/types";

// ─── Mock data (apenas runtime local — em prod virá de user_roles + profiles) ──

interface ManagedUser {
  id:        string;
  full_name: string;
  email:     string;
  roles:     AppRole[];
}

const INITIAL_USERS: ManagedUser[] = [
  { id: "user-1", full_name: "Usuário Local (Você)",      email: "local@example.com",        roles: ["superadmin"] },
  { id: "user-2", full_name: "Maria Aparecida Pereira",   email: "maria.pereira@cnbb.org.br", roles: ["admin", "organizer"] },
  { id: "user-3", full_name: "Pe. João Batista Souza",    email: "pe.joao@arquidiocese.com",  roles: ["organizer"] },
  { id: "user-4", full_name: "Ana Carolina Lima",         email: "ana.lima@paroquia.org",     roles: ["support"] },
  { id: "user-5", full_name: "Carlos Eduardo Ribeiro",    email: "carlos.rib@guardiao.dev",   roles: ["admin"] },
  { id: "user-6", full_name: "Fernanda Mendes",           email: "fmendes@catolicabrasil.org", roles: ["participant"] },
  { id: "user-7", full_name: "Rafael Santos",             email: "rafael.s@encontros.org",    roles: ["organizer", "participant"] },
];

const ALL_ROLES: AppRole[] = ["superadmin", "admin", "support", "organizer", "participant"];

const ROLE_STYLES: Record<AppRole, string> = {
  superadmin:  "bg-emerald-100 text-emerald-800 border border-emerald-200",
  admin:       "bg-blue-100 text-blue-800 border border-blue-200",
  support:     "bg-violet-100 text-violet-800 border border-violet-200",
  organizer:   "bg-amber-100 text-amber-800 border border-amber-200",
  participant: "bg-slate-100 text-slate-700 border border-slate-200",
};

const ROLE_LABEL: Record<AppRole, string> = {
  superadmin:  "SuperAdmin",
  admin:       "Admin",
  support:     "Suporte",
  organizer:   "Organizador",
  participant: "Participante",
};

const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id);

// ─── Componente ─────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  const { user, appRoles, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");

  const currentUserId = user?.id ?? "user-1"; // fallback mock

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const grantRole = (targetId: string, role: AppRole) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetId && !u.roles.includes(role)
          ? { ...u, roles: [...u.roles, role] }
          : u,
      ),
    );
    toast({
      title: "Role concedida",
      description: `${ROLE_LABEL[role]} atribuída ao usuário ${shortId(targetId)}.`,
    });
  };

  const revokeRole = (targetId: string, role: AppRole) => {
    // Trava de segurança: usuário corrente não pode revogar a própria role
    // de superadmin (anti-lockout).
    if (targetId === currentUserId && role === "superadmin") {
      toast({
        title: "Operação bloqueada",
        description: "Você não pode revogar sua própria role de SuperAdmin.",
        variant: "destructive",
      });
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetId ? { ...u, roles: u.roles.filter((r) => r !== role) } : u,
      ),
    );
    toast({
      title: "Role revogada",
      description: `${ROLE_LABEL[role]} removida do usuário ${shortId(targetId)}.`,
    });
  };

  const metrics = [
    { label: "Usuários ativos",    value: String(users.length), icon: Users,        color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Eventos publicados", value: "312",                icon: Calendar,     color: "text-blue-700",    bg: "bg-blue-50" },
    { label: "Faturamento (mês)",  value: "R$ 87.420,00",       icon: Wallet,       color: "text-purple-700",  bg: "bg-purple-50" },
    { label: "Incidentes abertos", value: "3",                  icon: AlertTriangle, color: "text-amber-700",  bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard do Administrador</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Visão consolidada da plataforma Guardião Eventos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && <Badge className="bg-emerald-700 hover:bg-emerald-700">SuperAdmin</Badge>}
          {appRoles.filter((r) => r !== "superadmin").map((r) => (
            <Badge key={r} variant="secondary">{ROLE_LABEL[r as AppRole] ?? r}</Badge>
          ))}
        </div>
      </div>

      {/* ── Sessão atual ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-slate-600">Sessão atual</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-1">
          <p><span className="font-medium">Usuário:</span> {user?.email ?? "—"}</p>
          <p><span className="font-medium">ID:</span> <code className="text-xs">{user?.id ?? "—"}</code></p>
          <p><span className="font-medium">Roles globais:</span> {appRoles.length ? appRoles.join(", ") : "nenhuma"}</p>
        </CardContent>
      </Card>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.bg}`}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-xl font-semibold text-slate-900">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Gestão de Usuários e Roles ── */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-emerald-700" />
              Gestão de Usuários e Roles
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Conceda ou revogue roles globais. Em produção, mutações são auditadas via
              <code className="mx-1 text-xs">user_roles.granted_by</code> e protegidas por RLS.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email, ID ou role…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-medium text-slate-600">Nome</TableHead>
                  <TableHead className="font-medium text-slate-600">E-mail</TableHead>
                  <TableHead className="font-medium text-slate-600">ID</TableHead>
                  <TableHead className="font-medium text-slate-600">Roles</TableHead>
                  <TableHead className="font-medium text-slate-600 text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                      Nenhum usuário corresponde ao filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUserId;
                    return (
                      <TableRow key={u.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{u.full_name}</span>
                            {isSelf && (
                              <span className="text-[10px] uppercase tracking-wide text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                você
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{u.email}</TableCell>
                        <TableCell>
                          <code className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {shortId(u.id)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">sem roles</span>
                            ) : (
                              u.roles.map((r) => (
                                <span
                                  key={r}
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[r]}`}
                                >
                                  {ROLE_LABEL[r]}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Conceder role</DropdownMenuLabel>
                              {ALL_ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                                <DropdownMenuItem
                                  key={`grant-${r}`}
                                  onClick={() => grantRole(u.id, r)}
                                  className="cursor-pointer"
                                >
                                  <UserPlus className="w-4 h-4 mr-2 text-emerald-700" />
                                  {ROLE_LABEL[r]}
                                </DropdownMenuItem>
                              ))}
                              {ALL_ROLES.every((r) => u.roles.includes(r)) && (
                                <DropdownMenuItem disabled className="text-xs text-slate-400 italic">
                                  Todas as roles já concedidas
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Revogar role</DropdownMenuLabel>
                              {u.roles.length === 0 ? (
                                <DropdownMenuItem disabled className="text-xs text-slate-400 italic">
                                  Nenhuma role para revogar
                                </DropdownMenuItem>
                              ) : (
                                u.roles.map((r) => {
                                  const isSelfSuperAdmin = isSelf && r === "superadmin";
                                  return (
                                    <DropdownMenuItem
                                      key={`revoke-${r}`}
                                      disabled={isSelfSuperAdmin}
                                      onClick={() => revokeRole(u.id, r)}
                                      className={
                                        isSelfSuperAdmin
                                          ? "text-slate-400"
                                          : "cursor-pointer text-rose-700 focus:text-rose-800 focus:bg-rose-50"
                                      }
                                    >
                                      {isSelfSuperAdmin ? (
                                        <Lock className="w-4 h-4 mr-2" />
                                      ) : (
                                        <UserMinus className="w-4 h-4 mr-2" />
                                      )}
                                      {ROLE_LABEL[r]}
                                      {isSelfSuperAdmin && (
                                        <span className="ml-auto text-[10px] uppercase">protegido</span>
                                      )}
                                    </DropdownMenuItem>
                                  );
                                })
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              {filteredUsers.length} de {users.length} usuário{users.length !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Auto-revogação de SuperAdmin bloqueada
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
