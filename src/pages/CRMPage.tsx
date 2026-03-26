import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Person {
  id: number;
  name: string;
  email: string;
  phone: string;
  tag: string;
}

interface Group {
  id: number;
  name: string;
  people: number;
  createdAt: string;
}

interface SimpleItem {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

interface TagItem {
  id: number;
  name: string;
  people: number;
  createdAt: string;
  color: string;
}

const mockPeople: Person[] = [
  { id: 1, name: "Maria Silva", email: "maria@email.com", phone: "(11) 98765-4321", tag: "Voluntária" },
  { id: 2, name: "João Santos", email: "joao@email.com", phone: "(11) 91234-5678", tag: "Convidado" },
  { id: 3, name: "Ana Oliveira", email: "ana@email.com", phone: "(21) 99876-5432", tag: "Liderança" },
];

const mockGroups: Group[] = [
  { id: 1, name: "Grupo de Jovens", people: 32, createdAt: "10/02/2026" },
  { id: 2, name: "Ministério de Música", people: 18, createdAt: "18/03/2026" },
];

const mockSectors: SimpleItem[] = [
  { id: 1, name: "Liturgia", description: "Equipe de apoio nas celebrações", createdAt: "04/01/2026" },
  { id: 2, name: "Acolhida", description: "Recepção e orientação", createdAt: "20/01/2026" },
];

const mockTags: TagItem[] = [
  { id: 1, name: "VIP", people: 5, createdAt: "01/02/2026", color: "#22c55e" },
  { id: 2, name: "Equipe", people: 12, createdAt: "08/02/2026", color: "#f97316" },
];

const mockCategories: SimpleItem[] = [
  { id: 1, name: "Inscrições" },
  { id: 2, name: "Voluntários" },
];

const tagColors = ["#22c55e", "#3b82f6", "#f97316", "#ec4899", "#a855f7", "#0ea5e9", "#facc15"];

const CRMPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentSection = location.pathname.split("/")[2] || "pessoas";
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch("");
  }, [currentSection]);

  const sections = [
    { key: "pessoas", label: "Pessoas" },
    { key: "grupos", label: "Grupos" },
    { key: "setores", label: "Setores" },
    { key: "tags", label: "Minhas Tags" },
    { key: "categorias", label: "Categorias" },
  ];

  const [people, setPeople] = useState<Person[]>(mockPeople);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [personForm, setPersonForm] = useState({
    name: "",
    document: "",
    birth: "",
    gender: "",
    maritalStatus: "",
    notes: "",
  });

  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    sector: "",
    day: "",
    time: "",
    duration: "",
    frequency: "",
    approval: false,
    status: "Ativo",
    description: "",
    address: "",
  });

  const [sectors, setSectors] = useState<SimpleItem[]>(mockSectors);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [sectorForm, setSectorForm] = useState({ name: "", description: "" });

  const [tags, setTags] = useState<TagItem[]>(mockTags);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagForm, setTagForm] = useState({ name: "", color: tagColors[0] });

  const [categories, setCategories] = useState<SimpleItem[]>(mockCategories);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "" });

  const filteredPeople = useMemo(() =>
    people.filter((p) =>
      [p.name, p.email, p.phone, p.tag].some((value) => value.toLowerCase().includes(search.toLowerCase()))
    ),
  [people, search]);

  const filteredGroups = useMemo(() =>
    groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())),
  [groups, search]);

  const filteredSectors = useMemo(() =>
    sectors.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
  [sectors, search]);

  const filteredTags = useMemo(() =>
    tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
  [tags, search]);

  const filteredCategories = useMemo(() =>
    categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
  [categories, search]);

  const handlePersonSave = () => {
    if (!personForm.name.trim()) return;
    setPeople((prev) => [
      {
        id: Date.now(),
        name: personForm.name,
        email: "-",
        phone: "-",
        tag: "Sem tag",
      },
      ...prev,
    ]);
    setPersonForm({ name: "", document: "", birth: "", gender: "", maritalStatus: "", notes: "" });
    setShowPersonForm(false);
    toast({ title: "Contato salvo", description: "Pessoa adicionada com sucesso." });
  };

  const handleGroupSave = () => {
    if (!groupForm.name.trim()) return;
    setGroups((prev) => [
      { id: Date.now(), name: groupForm.name, people: 0, createdAt: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setGroupForm({
      name: "",
      sector: "",
      day: "",
      time: "",
      duration: "",
      frequency: "",
      approval: false,
      status: "Ativo",
      description: "",
      address: "",
    });
    setGroupOpen(false);
    toast({ title: "Grupo salvo", description: "Grupo cadastrado com sucesso." });
  };

  const handleSectorSave = () => {
    if (!sectorForm.name.trim()) return;
    setSectors((prev) => [
      { id: Date.now(), name: sectorForm.name, description: sectorForm.description, createdAt: new Date().toLocaleDateString() },
      ...prev,
    ]);
    setSectorForm({ name: "", description: "" });
    setSectorOpen(false);
    toast({ title: "Setor salvo", description: "Setor cadastrado com sucesso." });
  };

  const handleTagSave = () => {
    if (!tagForm.name.trim()) return;
    setTags((prev) => [
      { id: Date.now(), name: tagForm.name, people: 0, createdAt: new Date().toLocaleDateString(), color: tagForm.color },
      ...prev,
    ]);
    setTagForm({ name: "", color: tagColors[0] });
    setTagOpen(false);
    toast({ title: "Tag salva", description: "Tag criada com sucesso." });
  };

  const handleCategorySave = () => {
    if (!categoryForm.name.trim()) return;
    setCategories((prev) => [{ id: Date.now(), name: categoryForm.name }, ...prev]);
    setCategoryForm({ name: "" });
    setCategoryOpen(false);
    toast({ title: "Categoria salva", description: "Categoria criada com sucesso." });
  };

  const sectionTitle = sections.find((section) => section.key === currentSection)?.label || "Pessoas";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM - {sectionTitle}</h1>
          <p className="text-muted-foreground mt-1">Organize pessoas, grupos e categorias da sua comunidade.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Button
              key={section.key}
              variant={currentSection === section.key ? "default" : "outline"}
              className={currentSection === section.key ? "bg-primary text-primary-foreground" : "border-slate-200"}
              onClick={() => navigate(`/crm/${section.key}`)}
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      {currentSection === "pessoas" && showPersonForm ? (
        <Card className="shadow-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Dados básicos</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações iniciais do contato.</p>
              </div>
              <Button variant="outline" onClick={() => setShowPersonForm(false)}>Voltar</Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome completo *</Label>
                <Input value={personForm.name} onChange={(e) => setPersonForm((prev) => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>CPF/CNPJ</Label>
                <Input value={personForm.document} onChange={(e) => setPersonForm((prev) => ({ ...prev, document: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Nascimento</Label>
                <Input type="date" value={personForm.birth} onChange={(e) => setPersonForm((prev) => ({ ...prev, birth: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={personForm.gender} onValueChange={(value) => setPersonForm((prev) => ({ ...prev, gender: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estado civil</Label>
                <Select value={personForm.maritalStatus} onValueChange={(value) => setPersonForm((prev) => ({ ...prev, maritalStatus: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solteiro">Solteiro</SelectItem>
                    <SelectItem value="Casado">Casado</SelectItem>
                    <SelectItem value="Divorciado">Divorciado</SelectItem>
                    <SelectItem value="Viúvo">Viúvo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Observações</Label>
                <textarea
                  className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={personForm.notes}
                  onChange={(e) => setPersonForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPersonForm(false)}>Cancelar</Button>
              <Button onClick={handlePersonSave} disabled={!personForm.name.trim()}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button className="gap-2" onClick={() => {
              if (currentSection === "pessoas") return setShowPersonForm(true);
              if (currentSection === "grupos") return setGroupOpen(true);
              if (currentSection === "setores") return setSectorOpen(true);
              if (currentSection === "tags") return setTagOpen(true);
              if (currentSection === "categorias") return setCategoryOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              + Adicionar
            </Button>
          </div>

          {currentSection === "pessoas" && (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeople.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">{person.name}</TableCell>
                        <TableCell>{person.email}</TableCell>
                        <TableCell>{person.phone}</TableCell>
                        <TableCell>{person.tag}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {currentSection === "grupos" && (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Pessoas</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.people}</TableCell>
                        <TableCell>{group.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {currentSection === "setores" && (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Adicionado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSectors.map((sector) => (
                      <TableRow key={sector.id}>
                        <TableCell className="font-medium">{sector.name}</TableCell>
                        <TableCell className="text-muted-foreground">{sector.description}</TableCell>
                        <TableCell>{sector.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {currentSection === "tags" && (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Pessoas</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                            {tag.name}
                          </div>
                        </TableCell>
                        <TableCell>{tag.people}</TableCell>
                        <TableCell>{tag.createdAt}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {currentSection === "categorias" && (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Exibindo 1 de 1 páginas</span>
          </div>
        </>
      )}

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Grupo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={groupForm.name} onChange={(e) => setGroupForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Setor</Label>
                <Select value={groupForm.sector} onValueChange={(value) => setGroupForm((prev) => ({ ...prev, sector: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Liturgia">Liturgia</SelectItem>
                    <SelectItem value="Acolhida">Acolhida</SelectItem>
                    <SelectItem value="Música">Música</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dia</Label>
                <Select value={groupForm.day} onValueChange={(value) => setGroupForm((prev) => ({ ...prev, day: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segunda">Segunda</SelectItem>
                    <SelectItem value="Quarta">Quarta</SelectItem>
                    <SelectItem value="Sábado">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={groupForm.time} onChange={(e) => setGroupForm((prev) => ({ ...prev, time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Duração</Label>
                <Input placeholder="Ex: 2h" value={groupForm.duration} onChange={(e) => setGroupForm((prev) => ({ ...prev, duration: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Frequência</Label>
                <Select value={groupForm.frequency} onValueChange={(value) => setGroupForm((prev) => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={groupForm.status}
                  onChange={(e) => setGroupForm((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupForm.approval}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, approval: e.target.checked }))}
              />
              Precisa de Aprovação?
            </label>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <textarea
                className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={groupForm.description}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                placeholder="Buscar endereço"
                value={groupForm.address}
                onChange={(e) => setGroupForm((prev) => ({ ...prev, address: e.target.value }))}
              />
              <div className="h-32 rounded-md border border-dashed flex items-center justify-center text-xs text-muted-foreground">
                <MapPin className="w-4 h-4 mr-2" /> Mapa integrado
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancelar</Button>
            <Button onClick={handleGroupSave} disabled={!groupForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sectorOpen} onOpenChange={setSectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Setor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={sectorForm.name} onChange={(e) => setSectorForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={sectorForm.description} onChange={(e) => setSectorForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSectorOpen(false)}>Cancelar</Button>
            <Button onClick={handleSectorSave} disabled={!sectorForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagOpen} onOpenChange={setTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={tagForm.name} onChange={(e) => setTagForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {tagColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTagForm((prev) => ({ ...prev, color }))}
                    className={`h-7 w-7 rounded-full border-2 ${tagForm.color === color ? "border-slate-900" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTagOpen(false)}>Cancelar</Button>
            <Button onClick={handleTagSave} disabled={!tagForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryOpen(false)}>Cancelar</Button>
            <Button onClick={handleCategorySave} disabled={!categoryForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMPage;
