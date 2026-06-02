import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Eye, Pencil, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers } from "@/hooks/use-admin-users";

interface AdminUser {
  id: string;
  nome: string;
  email: string;
  tipo: "Organizador" | "Participante";
  status: "Ativo" | "Banido";
}

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null);

  const { data: rawUsers = [] } = useAdminUsers();

  const users = useMemo<AdminUser[]>(
    () =>
      rawUsers.map((u) => ({
        id: u.user_id,
        nome: u.name ?? "—",
        email: u.email,
        tipo: "Participante",
        status: "Ativo",
      })),
    [rawUsers]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditNome(u.nome);
    setEditEmail(u.email);
  };

  const saveEdit = () => {
    if (!editUser) return;
    toast({ title: "Usuário atualizado" });
    setEditUser(null);
  };

  const confirmSuspend = () => {
    if (!suspendUser) return;
    toast({
      title: suspendUser.status === "Ativo" ? "Conta suspensa" : "Conta reativada",
      description: suspendUser.nome,
    });
    setSuspendUser(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualize e gerencie organizadores e participantes da plataforma.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              maxLength={100}
            />
          </div>

          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-slate-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {u.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === "Ativo" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Banido</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailsUser(u)}
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSuspendUser(u)}
                          title={u.status === "Ativo" ? "Suspender conta" : "Reativar conta"}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes */}
      <Dialog open={!!detailsUser} onOpenChange={(o) => !o && setDetailsUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do usuário</DialogTitle>
            <DialogDescription>Informações cadastrais do usuário.</DialogDescription>
          </DialogHeader>
          {detailsUser && (
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500">Nome:</span> <b>{detailsUser.nome}</b></div>
              <div><span className="text-slate-500">E-mail:</span> {detailsUser.email}</div>
              <div><span className="text-slate-500">Tipo:</span> {detailsUser.tipo}</div>
              <div><span className="text-slate-500">Status:</span> {detailsUser.status}</div>
              <div><span className="text-slate-500">ID:</span> {detailsUser.id}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsUser(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} maxLength={254} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspender */}
      <AlertDialog open={!!suspendUser} onOpenChange={(o) => !o && setSuspendUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspendUser?.status === "Ativo" ? "Suspender conta?" : "Reativar conta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspendUser?.status === "Ativo"
                ? `A conta de ${suspendUser?.nome} será banida e o usuário perderá acesso à plataforma.`
                : `A conta de ${suspendUser?.nome} será reativada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSuspend}
              className={
                suspendUser?.status === "Ativo"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersPage;
