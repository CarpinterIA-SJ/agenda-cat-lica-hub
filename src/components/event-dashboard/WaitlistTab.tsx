import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Plus, FileDown } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const WaitlistTab = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Fila de espera</h3>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold rounded-lg">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
          <Button variant="outline" className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold rounded-lg">
            <FileDown className="w-4 h-4" /> Exportar relatório
          </Button>
        </div>
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
              <TableHead className="font-semibold text-foreground">Nome</TableHead>
              <TableHead className="font-semibold text-foreground">E-mail</TableHead>
              <TableHead className="font-semibold text-foreground">Telefone</TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Cadastrado em</TableHead>
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

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Exibindo 1 de 0 páginas</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" disabled><span>‹</span></Button>
          <Button variant="default" size="icon" className="w-8 h-8 rounded-md text-xs">1</Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" disabled><span>›</span></Button>
        </div>
      </div>
    </div>
  );
};
