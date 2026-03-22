import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockCollaborators = [
  { id: 1, name: "João Silva", email: "joao@email.com", role: "Administrador", status: "Ativo" },
];

export const EventCollaboratorsTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<"active" | "pending">("active");
  const [search, setSearch] = useState("");

  const filtered = mockCollaborators.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-foreground">Colaboradores</h3>
        <Button className="gap-2 bg-primary hover:bg-primary/90 font-semibold">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4 border-b">
            <button
              onClick={() => setActiveSubTab("active")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${activeSubTab === "active" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            >
              Ativos
            </button>
            <button
              onClick={() => setActiveSubTab("pending")}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${activeSubTab === "pending" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            >
              Pendentes
            </button>
            <div className="ml-auto relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="font-semibold">Função</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum colaborador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.role}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive font-medium">
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
