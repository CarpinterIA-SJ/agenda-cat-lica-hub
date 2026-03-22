import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Download, Mail, Phone } from "lucide-react";

const mockPeople = [
  { id: 1, name: "Maria Silva", email: "maria@email.com", phone: "(11) 98765-4321", community: "São José", status: "Ativo" },
  { id: 2, name: "João Santos", email: "joao@email.com", phone: "(11) 91234-5678", community: "Santa Rita", status: "Ativo" },
  { id: 3, name: "Ana Oliveira", email: "ana@email.com", phone: "(21) 99876-5432", community: "São Paulo", status: "Inativo" },
  { id: 4, name: "Pedro Costa", email: "pedro@email.com", phone: "(31) 98765-1234", community: "Nossa Senhora", status: "Ativo" },
  { id: 5, name: "Lúcia Fernandes", email: "lucia@email.com", phone: "(41) 99988-7766", community: "São José", status: "Ativo" },
];

const CRMPage = () => {
  const [search, setSearch] = useState("");
  const filtered = mockPeople.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM - Pessoas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os contatos da sua comunidade</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" />Adicionar</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou e-mail..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">E-mail</TableHead>
                <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                <TableHead className="hidden sm:table-cell">Comunidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((person) => (
                <TableRow key={person.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-card-foreground">{person.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />{person.email}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />{person.phone}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{person.community}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      person.status === "Ativo" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {person.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMPage;
