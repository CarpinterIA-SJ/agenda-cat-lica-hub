import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  HandHeart,
  Headset,
  Heart,
  CalendarDays,
  Ticket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyOrganizations } from "@/hooks/use-organizations";
import { useEvents } from "@/hooks/use-events";

const DashboardPage = () => {
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // TODAS as organizações do dono: a home agrega dados de todas, não só da
  // mais antiga (um organizador pode ter mais de uma org).
  const { data: myOrgs = [] } = useMyOrganizations();
  const orgIds = myOrgs.map((o) => o.id);
  // Sem org resolvida, NÃO buscar: query sem filtro retornaria todos os eventos
  // públicos via RLS (vazamento). Restringe às orgs do usuário (owner_id).
  const { data: events = [] } = useEvents(
    orgIds.length ? { organization_ids: orgIds } : undefined,
    { enabled: orgIds.length > 0 },
  );
  const eventIds = events.map((e) => e.id);

  // Inscrições reais somadas em todos os eventos do organizador (todas as orgs).
  const { data: registrationCount = 0 } = useQuery({
    queryKey: ["dashboard-registration-count", orgIds, eventIds],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_registrations")
        .select("id", { count: "exact", head: true })
        .in("event_id", eventIds);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Contatos reais do CRM somados de todas as organizações do organizador.
  const { data: crmCount = 0 } = useQuery({
    queryKey: ["dashboard-crm-count", orgIds],
    enabled: orgIds.length > 0,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true })
        .in("organization_id", orgIds);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (role === "participant") {
    return <Navigate to="/participante/meus-ingressos" replace />;
  }

  if (role !== "organizer") {
    return <Navigate to="/role-select" replace />;
  }

  if (location.pathname === "/dashboard") {
    return <Navigate to="/organizador/home" replace />;
  }

  const activeSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR")
    : "—";

  const stats = [
    { label: "Total de eventos", value: events.length, icon: Calendar, color: "text-primary" },
    { label: "Total de campanhas de doações", value: 0, icon: Heart, color: "text-orange-500" },
    { label: "Total de contatos no CRM", value: crmCount, icon: Users, color: "text-blue-500" },
    { label: "Total de inscrições em eventos", value: registrationCount, icon: Ticket, color: "text-orange-500" },
    { label: "Total de doadores cadastrados", value: 0, icon: HandHeart, color: "text-orange-500" },
    { label: "Conta ativa desde", value: activeSince, icon: CalendarDays, color: "text-blue-500" },
  ];

  const quickAccess = [
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users, route: "/crm" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Olá, Seja bem-vindo(a) ao painel Guardião Eventos!
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Acesso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col items-center justify-center gap-3 text-center hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
