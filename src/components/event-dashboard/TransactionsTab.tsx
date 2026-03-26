import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, FileDown, CheckCircle, AlertCircle, XCircle, Clock, Wallet, HandCoins } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const TransactionsTab = () => {
  const [search, setSearch] = useState("");

  const summaryCards = [
    { label: "Total líquido", value: "R$ 0,00", icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total pendentes", value: "R$ 0,00", icon: AlertCircle, color: "text-orange-500", bg: "bg-orange-100" },
    { label: "Total cancelados", value: "R$ 0,00", icon: XCircle, color: "text-red-500", bg: "bg-red-100" },
    { label: "Aguardando liberação", value: "R$ 0,00", icon: Clock, color: "text-orange-500", bg: "bg-orange-100" },
    { label: "Total a receber", value: "R$ 0,00", icon: Wallet, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Total recebido", value: "R$ 0,00", icon: HandCoins, color: "text-blue-600", bg: "bg-blue-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-card rounded-xl border shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold text-foreground">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Histórico de transações</h3>
          <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold rounded-lg">
            <FileDown className="w-4 h-4" /> Exportar relatório
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-lg" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-lg">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Cod Pedido</TableHead>
                <TableHead className="font-semibold text-foreground">Nome responsável</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Data</TableHead>
                <TableHead className="font-semibold text-foreground">Forma de pagamento</TableHead>
                <TableHead className="font-semibold text-foreground">Valor líquido</TableHead>
                <TableHead className="font-semibold text-foreground">Status Pagamento</TableHead>
                <TableHead className="font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  Nenhum dado adicionado.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Exibindo 1 de 0 páginas</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled><span>‹</span></Button>
            <Button variant="default" size="icon" className="w-8 h-8 rounded-md text-xs">1</Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled><span>›</span></Button>
          </div>
        </div>
      </div>
    </div>
  );
};
