import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, FileDown, Users, BookmarkCheck, CheckSquare } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const ParticipantsListTab = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participantes confirmados</p>
            <p className="text-xs text-muted-foreground">(pagamento realizado)</p>
            <p className="text-2xl font-bold text-foreground mt-1">0</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <BookmarkCheck className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participantes pendentes</p>
            <p className="text-xs text-muted-foreground">(aguardando pagamento)</p>
            <p className="text-2xl font-bold text-foreground mt-1">0</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckSquare className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Check-ins realizados</p>
            <p className="text-2xl font-bold text-foreground mt-1">0</p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Lista de participantes</h3>
          <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold rounded-lg">
            <FileDown className="w-4 h-4" /> Exportar relatório
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
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
                <TableHead className="font-semibold text-foreground">Nome</TableHead>
                <TableHead className="font-semibold text-foreground">Código</TableHead>
                <TableHead className="font-semibold text-foreground">Data de inscrição</TableHead>
                <TableHead className="font-semibold text-foreground">Ingresso</TableHead>
                <TableHead className="font-semibold text-foreground">Status pedido</TableHead>
                <TableHead className="font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  Nenhum dado adicionado.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
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
