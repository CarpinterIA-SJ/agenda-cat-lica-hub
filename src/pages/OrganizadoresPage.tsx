import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Organizador {
  id: string;
  nome: string;
  email: string;
  descricao: string;
  logo: string | null;
  dataCriacao: string;
}

const OrganizadoresPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrganizador, setSelectedOrganizador] = useState<Organizador | null>(null);
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [organizadores, setOrganizadores] = useState<Organizador[]>([
    {
      id: "1",
      nome: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE",
      email: "fabricio.christian@hotmail.com",
      descricao: "",
      logo: null,
      dataCriacao: "22/03/2026",
    },
  ]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewLogo(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const filtered = organizadores.filter(
    (o) =>
      o.nome.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAdd = () => {
    if (!newNome || !newEmail || !newDescricao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const novo: Organizador = {
      id: Date.now().toString(),
      nome: newNome.toUpperCase(),
      email: newEmail,
      descricao: newDescricao,
      logo: newLogo,
      dataCriacao: new Date().toLocaleDateString("pt-BR"),
    };
    setOrganizadores((prev) => [...prev, novo]);
    setNewNome("");
    setNewEmail("");
    setNewDescricao("");
    setNewLogo(null);
    setShowAddDialog(false);
    toast({ title: "Organizador adicionado com sucesso" });
  };

  const handleEdit = () => {
    if (!selectedOrganizador || !newNome || !newEmail) return;
    setOrganizadores((prev) =>
      prev.map((o) =>
        o.id === selectedOrganizador.id ? { ...o, nome: newNome.toUpperCase(), email: newEmail, descricao: newDescricao, logo: newLogo } : o
      )
    );
    setShowEditDialog(false);
    setSelectedOrganizador(null);
    setNewNome("");
    setNewEmail("");
    setNewDescricao("");
    setNewLogo(null);
    toast({ title: "Organizador atualizado com sucesso" });
  };

  const handleDelete = () => {
    if (!selectedOrganizador) return;
    setOrganizadores((prev) => prev.filter((o) => o.id !== selectedOrganizador.id));
    setShowDeleteDialog(false);
    setSelectedOrganizador(null);
    toast({ title: "Organizador removido com sucesso" });
  };

  const openEdit = (org: Organizador) => {
    setSelectedOrganizador(org);
    setNewNome(org.nome);
    setNewEmail(org.email);
    setNewDescricao(org.descricao);
    setNewLogo(org.logo);
    setShowEditDialog(true);
  };

  const openDelete = (org: Organizador) => {
    setSelectedOrganizador(org);
    setShowDeleteDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Organizadores</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            onClick={() => {
              setNewNome("");
              setNewEmail("");
              setNewDescricao("");
              setNewLogo(null);
              setShowAddDialog(true);
            }}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Content Card */}
      <Card className="border bg-card">
        <CardContent className="p-6">
          {/* Search & Filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-foreground">Nome</TableHead>
                <TableHead className="font-semibold text-foreground">E-mail</TableHead>
                <TableHead className="font-semibold text-foreground">Data de criação</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum organizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="text-primary font-medium">{org.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{org.email}</TableCell>
                    <TableCell className="text-muted-foreground">{org.dataCriacao}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(org)}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(org)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-primary">
              Exibindo {currentPage} de {totalPages} páginas
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "ghost"}
                  size="icon"
                  className={`h-8 w-8 ${page === currentPage ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar novo organizador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Logo:</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {newLogo ? (
                  <img src={newLogo} alt="Logo preview" className="max-h-20 object-contain rounded" />
                ) : (
                  <>
                    <Button type="button" size="sm" className="bg-primary text-primary-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar imagem
                    </Button>
                    <span className="text-sm text-muted-foreground">Ou arraste e solte a imagem aqui</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Nome:</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Escreva aqui..." />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> E-mail:</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Escreva aqui..." type="email" />
              <p className="text-xs text-muted-foreground">Esse será o email que receberá os contatos feitos por participantes através do "Fale com o Organizador".</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Descrição:</Label>
              <Textarea value={newDescricao} onChange={(e) => setNewDescricao(e.target.value)} placeholder="Escreva aqui..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdd} className="bg-primary text-primary-foreground">Criar organizador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar organizador - {selectedOrganizador?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Logo:</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {newLogo ? (
                  <img src={newLogo} alt="Logo preview" className="max-h-20 object-contain rounded" />
                ) : (
                  <>
                    <Button type="button" size="sm" className="bg-primary text-primary-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar imagem
                    </Button>
                    <span className="text-sm text-muted-foreground">Ou arraste e solte a imagem aqui</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Nome:</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Escreva aqui..." />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> E-mail:</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Escreva aqui..." type="email" />
              <p className="text-xs text-muted-foreground">Esse será o email que receberá os contatos feitos por participantes através do "Fale com o Organizador".</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Descrição:</Label>
              <Textarea value={newDescricao} onChange={(e) => setNewDescricao(e.target.value)} placeholder="Escreva aqui..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEdit} className="bg-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o organizador <strong>{selectedOrganizador?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizadoresPage;
