import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, TrendingUp, Users, DollarSign } from "lucide-react";

const DonationsPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Doações</h1>
      <p className="text-muted-foreground mt-1">Acompanhe campanhas e doações recebidas</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Arrecadado", value: "R$ 45.230", icon: DollarSign, color: "text-success bg-success/10" },
        { label: "Campanhas Ativas", value: "8", icon: Heart, color: "text-destructive bg-destructive/10" },
        { label: "Doadores", value: "456", icon: Users, color: "text-primary bg-primary/10" },
        { label: "Crescimento", value: "+12%", icon: TrendingUp, color: "text-gold bg-gold/10" },
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
    <Card className="shadow-card">
      <CardHeader><CardTitle>Últimas Doações</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            { name: "João Santos", amount: "R$ 150,00", date: "Hoje", campaign: "Reforma da Igreja" },
            { name: "Maria Silva", amount: "R$ 80,00", date: "Ontem", campaign: "Ação Social" },
            { name: "Pedro Costa", amount: "R$ 200,00", date: "20 Mar", campaign: "Reforma da Igreja" },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.campaign} · {d.date}</p>
              </div>
              <span className="font-semibold text-success text-sm">{d.amount}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default DonationsPage;
