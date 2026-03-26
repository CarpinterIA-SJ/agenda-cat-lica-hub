import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Calendar,
  LayoutGrid,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Home,
  Users2,
  Headset,
  Ticket,
  Mail,
  Users,
  HelpCircle,
  LogOut,
  User,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const mockEvents = [
  {
    id: 1,
    name: "Encontro de Jovens",
    startDate: "21/10/2026",
    endDate: "22/10/2026",
  },
];

const mockCategories = [
  { id: 1, name: "Retiro", status: "Ativo" },
  { id: 2, name: "Formação", status: "Inativo" },
];

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>(mockEvents);
  const [categories, setCategories] = useState<any[]>(mockCategories);
  const [eventSearch, setEventSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [eventOption, setEventOption] = useState("");
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", status: "Ativo" });

  const isCategoriesRoute = location.pathname.includes("categorias");
  const [tab, setTab] = useState(isCategoriesRoute ? "categorias" : "lista");

  useEffect(() => {
    setTab(isCategoriesRoute ? "categorias" : "lista");
  }, [isCategoriesRoute]);

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  const appItems = [
    { label: "Home", icon: Home, route: "/organizador/home" },
    { label: "Guardião Eventos", icon: Calendar, route: "/organizador/meus-eventos" },
    { label: "CRM", icon: Users2, route: "/crm/pessoas" },
    { label: "Atendimento", icon: Headset, route: "/support" },
  ];

  const handleEventSave = () => {
    if (!eventOption) return;
    setEventDialogOpen(false);
    toast({ title: "Solicitação enviada", description: "Sua escolha foi registrada." });
    setEventOption("");
  };

  const handleCategorySave = () => {
    if (!categoryForm.name.trim()) return;
    setCategories((prev) => [
      { id: Date.now(), name: categoryForm.name, status: categoryForm.status },
      ...prev,
    ]);
    setCategoryForm({ name: "", description: "", status: "Ativo" });
    setCategoryDialogOpen(false);
    toast({ title: "Categoria salva", description: "Categoria cadastrada com sucesso." });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-slate-900">Guardião Eventos</span>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-primary">
                  <LayoutGrid className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 border-gray-100 shadow-sm">
                <div className="text-sm font-semibold text-slate-900 mb-3">Aplicações</div>
                <div className="grid grid-cols-2 gap-3">
                  {appItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.route)}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-slate-700">{item.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-600 hover:text-primary"
                    onClick={() => setIsDark((prev) => !prev)}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alterar tema</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">FC</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-gray-100 shadow-sm">
                <DropdownMenuLabel className="font-normal text-[11px] text-slate-400">
                  fabricio.christian@gmail.com
                </DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <LayoutGrid className="w-4 h-4" />
                  Ver aplicações
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  Minha conta
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Ticket className="w-4 h-4" />
                  Meus ingressos
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Convites pendentes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Users className="w-4 h-4" />
                  Organizadores
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <HelpCircle className="w-4 h-4" />
                  Ajuda
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
            <p className="text-sm text-slate-500">Gerencie os eventos e categorias da plataforma.</p>
          </div>
          {tab === "lista" ? (
            <Button onClick={() => setEventDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              + Adicionar
            </Button>
          ) : (
            <Button onClick={() => setCategoryDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
              + Adicionar
            </Button>
          )}
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value);
            navigate(value === "categorias" ? "/organizador/eventos/categorias" : "/organizador/meus-eventos");
          }}
        >
          <TabsList className="bg-transparent p-0 h-auto gap-6">
            <TabsTrigger
              value="lista"
              className="px-0 pb-2 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Lista de eventos
            </TabsTrigger>
            <TabsTrigger
              value="categorias"
              className="px-0 pb-2 text-slate-500 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Categorias de eventos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "lista" ? (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por evento..."
                className="pl-10 bg-white"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
            </div>
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Evento</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Data de Término</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{event.startDate}</TableCell>
                        <TableCell>{event.endDate}</TableCell>
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
          </>
        ) : (
          <>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar categoria..."
                className="pl-10 bg-white"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            </div>
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            category.status === "Ativo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            {category.status}
                          </span>
                        </TableCell>
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
          </>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">Exibindo 1 de 1 páginas</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="border-primary text-primary">1</Button>
            <Button variant="ghost" size="icon" className="text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Select value={eventOption} onValueChange={setEventOption}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Registrar um novo evento</SelectItem>
                <SelectItem value="vincular">Vincular a um novo evento da plataforma Guardião Eventos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleEventSave} disabled={!eventOption}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome</label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Input value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={categoryForm.status}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCategorySave} disabled={!categoryForm.name.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <a
        href="https://wa.me/5500000000000"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>
    </div>
  );
};

export default OrganizerEventsPage;
