import { Calendar, Users, Ticket, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Total de Eventos", value: "24", icon: Calendar, change: "+3 este mês", color: "text-primary bg-primary/10" },
  { label: "Contatos CRM", value: "1.247", icon: Users, change: "+48 novos", color: "text-info bg-info/10" },
  { label: "Inscrições em Eventos", value: "3.891", icon: Ticket, change: "+312 esta semana", color: "text-success bg-success/10" },
];

const DashboardPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Santo Painel</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua organização</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-success font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-card-foreground mb-4">Próximos Eventos</h3>
            <div className="space-y-3">
              {[
                { name: "Retiro de Quaresma", date: "28 Mar 2026", attendees: 120 },
                { name: "Missa Solene de Páscoa", date: "05 Abr 2026", attendees: 350 },
                { name: "Encontro de Jovens", date: "12 Abr 2026", attendees: 85 },
              ].map((event) => (
                <div key={event.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                    {event.attendees} inscritos
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-card-foreground mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {[
                { action: "Nova inscrição", detail: "Maria Silva - Retiro de Quaresma", time: "2 min atrás" },
                { action: "Doação recebida", detail: "R$ 150,00 - João Santos", time: "15 min atrás" },
                { action: "Evento criado", detail: "Encontro de Casais - Maio", time: "1h atrás" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
