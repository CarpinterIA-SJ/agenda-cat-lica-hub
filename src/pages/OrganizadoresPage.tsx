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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Plus, Search, Filter, Pencil, Trash2, ChevronLeft, ChevronRight, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const LOGO_BUCKET = "organization-logos";
const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const LOGO_MIME = ["image/png", "image/jpeg", "image/webp"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Iniciais da org para o fallback do avatar (1 palavra → 2 letras; senão 1ª+última). */
const getOrgInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Extrai o path interno do bucket a partir da URL pública (para remover o arquivo). */
const logoPathFromUrl = (url: string): string | null => {
  const marker = `/${LOGO_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
};

/** Faz upload do logo sob a pasta do próprio usuário e devolve path + URL pública. */
const uploadLogo = async (userId: string, file: File): Promise<{ path: string; url: string }> => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
};
import {
  useMyOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  buildOrgSlug,
} from "@/hooks/use-organizations";

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
  const { data: orgs = [], isLoading } = useMyOrganizations();
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const deleteOrg = useDeleteOrganization();
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrganizador, setSelectedOrganizador] = useState<Organizador | null>(null);
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDescricao, setNewDescricao] = useState("");
  const [newLogo, setNewLogo] = useState<string | null>(null);     // preview: data URL (novo) ou URL pública (edição)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null); // arquivo pendente de upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Linhas reais da tabela organizations (colunas persistidas via migration 017).
  const organizadores: Organizador[] = orgs.map((o) => ({
    id: o.id,
    nome: o.name,
    email: o.contact_email ?? "",
    descricao: o.description ?? "",
    logo: o.logo_url,
    dataCriacao: new Date(o.created_at).toLocaleDateString("pt-BR"),
  }));

  // Valida tipo/tamanho e prepara preview + arquivo para upload.
  const processLogoFile = useCallback((file: File) => {
    if (!LOGO_MIME.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use PNG, JPEG ou WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast({ title: "Imagem muito grande", description: "O logo deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    setNewLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  }, [processLogoFile]);

  const filtered = organizadores.filter(
    (o) =>
      o.nome.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetForm = () => {
    setNewNome("");
    setNewEmail("");
    setNewDescricao("");
    setNewLogo(null);
    setNewLogoFile(null);
  };

  // Valida os campos compartilhados do formulário (add/edit). Retorna ok + mensagem.
  const validateForm = (): { ok: boolean } => {
    if (!newNome.trim()) {
      toast({ title: "Informe o nome do organizador", variant: "destructive" });
      return { ok: false };
    }
    if (!EMAIL_RE.test(newEmail.trim())) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail de contato válido.", variant: "destructive" });
      return { ok: false };
    }
    if (newDescricao.trim().length < 10) {
      toast({ title: "Descrição muito curta", description: "Use ao menos 10 caracteres.", variant: "destructive" });
      return { ok: false };
    }
    return { ok: true };
  };

  const handleAdd = async () => {
    if (!validateForm().ok) return;
    // Resolve o usuário autenticado na hora: força refresh do token e garante
    // que owner_id == auth.uid() vigente. Se a sessão expirou, falha aqui com
    // mensagem clara em vez do RLS "violates row-level security policy".
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
      return;
    }
    const name = newNome.trim().toUpperCase();
    let uploadedPath: string | null = null; // p/ cleanup se o INSERT falhar
    try {
      let logoUrl: string | null = null;
      if (newLogoFile) {
        const up = await uploadLogo(authUser.id, newLogoFile);
        uploadedPath = up.path;
        logoUrl = up.url;
      }
      await createOrg.mutateAsync({
        name,
        slug: buildOrgSlug(name),
        owner_id: authUser.id,
        contact_email: newEmail.trim(),
        description: newDescricao.trim(),
        logo_url: logoUrl,
      });
      resetForm();
      setShowAddDialog(false);
      toast({ title: "Organizador adicionado com sucesso" });
    } catch (e: any) {
      if (uploadedPath) {
        await supabase.storage.from(LOGO_BUCKET).remove([uploadedPath]).catch(() => {});
      }
      toast({ title: "Erro ao adicionar organizador", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedOrganizador) return;
    if (!validateForm().ok) return;
    const name = newNome.trim().toUpperCase();
    let uploadedPath: string | null = null;
    let logoUrl: string | null = selectedOrganizador.logo; // mantém o atual por padrão
    try {
      if (newLogoFile) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.id) {
          toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
          return;
        }
        const up = await uploadLogo(authUser.id, newLogoFile);
        uploadedPath = up.path;
        logoUrl = up.url;
      }
      await updateOrg.mutateAsync({
        id: selectedOrganizador.id,
        name,
        slug: buildOrgSlug(name, selectedOrganizador.id.slice(0, 8)),
        contact_email: newEmail.trim(),
        description: newDescricao.trim(),
        logo_url: logoUrl,
      });
      // Logo substituído com sucesso → remove o antigo (best-effort, evita órfão).
      const oldPath = selectedOrganizador.logo ? logoPathFromUrl(selectedOrganizador.logo) : null;
      if (uploadedPath && oldPath && oldPath !== uploadedPath) {
        await supabase.storage.from(LOGO_BUCKET).remove([oldPath]).catch(() => {});
      }
      setShowEditDialog(false);
      setSelectedOrganizador(null);
      resetForm();
      toast({ title: "Organizador atualizado com sucesso" });
    } catch (e: any) {
      if (uploadedPath) {
        await supabase.storage.from(LOGO_BUCKET).remove([uploadedPath]).catch(() => {});
      }
      toast({ title: "Erro ao atualizar organizador", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedOrganizador) return;
    try {
      await deleteOrg.mutateAsync(selectedOrganizador.id);
      setShowDeleteDialog(false);
      setSelectedOrganizador(null);
      toast({ title: "Organizador removido com sucesso" });
    } catch (e: any) {
      toast({ title: "Erro ao remover organizador", description: e.message, variant: "destructive" });
    }
  };

  const openEdit = (org: Organizador) => {
    setSelectedOrganizador(org);
    setNewNome(org.nome);
    setNewEmail(org.email);
    setNewDescricao(org.descricao);
    setNewLogo(org.logo);
    setNewLogoFile(null);
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
              resetForm();
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
                maxLength={100}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    <Loader2 className="w-5 h-5 animate-spin inline" />
                  </TableCell>
                </TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum organizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          {org.logo ? <AvatarImage src={org.logo} alt={org.nome} className="object-cover" /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {getOrgInitials(org.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-primary font-medium">{org.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{org.email || "—"}</TableCell>
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
              <Label>Logo: <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
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
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Escreva aqui..." maxLength={100} />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> E-mail:</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Escreva aqui..." type="email" maxLength={254} />
              <p className="text-xs text-muted-foreground">Esse será o email que receberá os contatos feitos por participantes através do "Fale com o Organizador".</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Descrição:</Label>
              <Textarea value={newDescricao} onChange={(e) => setNewDescricao(e.target.value)} placeholder="Escreva aqui..." rows={4} maxLength={2000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={createOrg.isPending} className="bg-primary text-primary-foreground">
              {createOrg.isPending ? "Criando..." : "Criar organizador"}
            </Button>
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
              <Label>Logo: <span className="text-xs text-muted-foreground font-normal">(opcional)</span></Label>
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
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Escreva aqui..." maxLength={100} />
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> E-mail:</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Escreva aqui..." type="email" maxLength={254} />
              <p className="text-xs text-muted-foreground">Esse será o email que receberá os contatos feitos por participantes através do "Fale com o Organizador".</p>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label><span className="text-destructive">*</span> Descrição:</Label>
              <Textarea value={newDescricao} onChange={(e) => setNewDescricao(e.target.value)} placeholder="Escreva aqui..." rows={4} maxLength={2000} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={updateOrg.isPending} className="bg-primary text-primary-foreground">
              {updateOrg.isPending ? "Salvando..." : "Salvar"}
            </Button>
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleteOrg.isPending}>
              {deleteOrg.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizadoresPage;
