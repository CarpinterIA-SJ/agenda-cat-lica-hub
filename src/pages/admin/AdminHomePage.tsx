import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, UserPlus, Wallet, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";

const salesData = [
  { mes: "Jan", vendas: 12400 },
  { mes: "Fev", vendas: 15800 },
  { mes: "Mar", vendas: 21300 },
  { mes: "Abr", vendas: 18900 },
  { mes: "Mai", vendas: 26500 },
  { mes: "Jun", vendas: 31200 },
  { mes: "Jul", vendas: 28700 },
  { mes: "Ago", vendas: 35400 },
  { mes: "Set", vendas: 39800 },
  { mes: "Out", vendas: 42100 },
  { mes: "Nov", vendas: 47600 },
  { mes: "Dez", vendas: 52300 },
];

const AdminHomePage = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-home-stats"],
    queryFn: async () => {
      const [paidEvents, activeEvents, users, pendingPayments] = await Promise.all([
        supabase.from("payments").select("net_cents").eq("status", "paid"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const totalSales = (paidEvents.data ?? []).reduce((sum: number, p: any) => sum + (p.net_cents ?? 0), 0);
      return {
        totalSales,
        activeEvents: activeEvents.count ?? 0,
        users: users.count ?? 0,
        pendingPayments: pendingPayments.count ?? 0,
      };
    },
  });

  const metrics = [
    {
      label: "Total de Vendas (líquido)",
      value: ((stats?.totalSales ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      icon: DollarSign,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Total de Eventos Ativos",
      value: String(stats?.activeEvents ?? 0),
      icon: Calendar,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Usuários cadastrados",
      value: String(stats?.users ?? 0),
      icon: UserPlus,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Pagamentos pendentes",
      value: String(stats?.pendingPayments ?? 0),
      icon: Wallet,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral da Plataforma</h1>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe os principais indicadores do Guardião Eventos em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-slate-200 rounded-2xl">
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Vendas mês a mês
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Comparativo de vendas acumuladas nos últimos 12 meses.
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">+18,4%</span>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `R$ ${v / 1000}k`} />
              <RechartsTooltip
                formatter={(value: number) =>
                  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
              />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#059669" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomePage;
