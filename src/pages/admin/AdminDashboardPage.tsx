import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, Calendar, Wallet, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AdminDashboardPage = () => {
  const { user, appRoles, isSuperAdmin } = useAuth();

  const metrics = [
    { label: "Usuários ativos",     value: "1.284", icon: Users,    color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Eventos publicados",  value: "312",   icon: Calendar, color: "text-blue-700",    bg: "bg-blue-50" },
    { label: "Faturamento (mês)",   value: "R$ 87.420,00", icon: Wallet,  color: "text-purple-700",  bg: "bg-purple-50" },
    { label: "Incidentes abertos",  value: "3",     icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
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
          {isSuperAdmin && (
            <Badge variant="default" className="bg-emerald-700">SuperAdmin</Badge>
          )}
          {appRoles.filter((r) => r !== "superadmin").map((r) => (
            <Badge key={r} variant="secondary">{r}</Badge>
          ))}
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Controles avançados</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Em construção. Aqui ficarão: feature flags globais, gestão de roles
          (concessão de superadmin/admin), auditoria de logins, configurações
          do gateway de pagamento.
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
