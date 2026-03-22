import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Church, TrendingUp, Users, Calendar } from "lucide-react";

const TithePage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dízimo</h1>
      <p className="text-muted-foreground mt-1">Controle de dízimos da comunidade</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Dízimo do Mês", value: "R$ 12.450", icon: Church, color: "text-primary bg-primary/10" },
        { label: "Dizimistas Ativos", value: "312", icon: Users, color: "text-info bg-info/10" },
        { label: "Média Mensal", value: "R$ 11.800", icon: TrendingUp, color: "text-success bg-success/10" },
        { label: "Meses Registrados", value: "18", icon: Calendar, color: "text-gold bg-gold/10" },
      ].map((s) => (
        <Card key={s.label} className="shadow-card">
          <CardContent className="p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default TithePage;
