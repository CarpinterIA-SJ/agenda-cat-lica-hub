import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Download, Mail, Phone, MapPin, Church } from "lucide-react";

interface Person {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  parish: string;
  community: string;
  status: string;
}

const mockPeople: Person[] = [
  { id: 1, name: "Maria Silva", email: "maria@email.com", phone: "(11) 98765-4321", whatsapp: "(11) 98765-4321", city: "São Paulo", parish: "Paróquia São José", community: "São José", status: "Ativo" },
  { id: 2, name: "João Santos", email: "joao@email.com", phone: "(11) 91234-5678", whatsapp: "(11) 91234-5678", city: "Campinas", parish: "Paróquia Santa Rita", community: "Santa Rita", status: "Ativo" },
  { id: 3, name: "Ana Oliveira", email: "ana@email.com", phone: "(21) 99876-5432", whatsapp: "(21) 99876-5432", city: "Rio de Janeiro", parish: "Paróquia São Paulo Apóstolo", community: "São Paulo", status: "Inativo" },
  { id: 4, name: "Pedro Costa", email: "pedro@email.com", phone: "(31) 98765-1234", whatsapp: "(31) 98765-1234", city: "Belo Horizonte", parish: "Paróquia Nossa Senhora", community: "Nossa Senhora", status: "Ativo" },
  { id: 5, name: "Lúcia Fernandes", email: "lucia@email.com", phone: "(41) 99988-7766", whatsapp: "(41) 99988-7766", city: "Curitiba", parish: "Paróquia São José", community: "São José", status: "Ativo" },
];

const emptyForm: Omit<Person, "id"> = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  city: "",
  parish: "",
  community: "",
  status: "Ativo",
};

const CRMPage = () => {
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Person, "id">>(emptyForm);

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase()) ||
    p.parish.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const newPerson: Person = { id: Date.now(), ...form };
    setPeople((prev) => [newPerson, ...prev]);
    setForm(emptyForm);
    setOpen(false);
  };

  const handleOpen = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM - Pessoas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os contatos da sua comunidade</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
          <Button className="gap-2" onClick={handleOpen}><Plus className="w-4 h-4" />Adicionar</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade, paróquia..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">WhatsApp</TableHead>
                  <TableHead className="hidden xl:table-cell">Cidade</TableHead>
                  <TableHead className="hidden sm:table-cell">Paróquia</TableHead>
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
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-green-500" />{person.whatsapp}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />{person.city}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Church className="w-3.5 h-3.5" />{person.parish}
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
          </div>
        </CardContent>
      </Card>

      {/* Modal de Cadastro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" name="name" placeholder="Ex: Maria da Silva" value={form.name} onChange={handleChange} />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="Ex: maria@email.com" value={form.email} onChange={handleChange} />
            </div>

            {/* Telefone e WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" name="phone" placeholder="(00) 00000-0000" value={form.phone} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" placeholder="(00) 00000-0000" value={form.whatsapp} onChange={handleChange} />
              </div>
            </div>

            {/* Cidade */}
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" name="city" placeholder="Ex: São Paulo" value={form.city} onChange={handleChange} />
            </div>

            {/* Paróquia */}
            <div className="space-y-1.5">
              <Label htmlFor="parish">Paróquia</Label>
              <Input id="parish" name="parish" placeholder="Ex: Paróquia São José" value={form.parish} onChange={handleChange} />
            </div>

            {/* Comunidade */}
            <div className="space-y-1.5">
              <Label htmlFor="community">Comunidade</Label>
              <Input id="community" name="community" placeholder="Ex: Comunidade São José" value={form.community} onChange={handleChange} />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Salvar Contato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMPage;
