import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Search, SlidersHorizontal } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  event: any;
}

export const EventTicketsTab = ({ event }: Props) => {
  const tickets = event.tickets || event.details?.tickets || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketType, setTicketType] = useState<"paid" | "free">("paid");
  const [search, setSearch] = useState("");

  const openModal = (type: "paid" | "free") => {
    setTicketType(type);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title + Buttons */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-foreground border-l-4 border-primary pl-3">Ingressos</h3>
          <div className="flex gap-3">
            <Button onClick={() => openModal("paid")} className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 font-semibold rounded-lg">
              <Plus className="w-4 h-4" /> Ingresso pago
            </Button>
            <Button onClick={() => openModal("free")} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg">
              <Plus className="w-4 h-4" /> Ingresso gratuito
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-lg border-border"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 rounded-lg">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-foreground">Nome</TableHead>
                <TableHead className="font-semibold text-foreground">Quantidade</TableHead>
                <TableHead className="font-semibold text-foreground">Preço</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Visibilidade</TableHead>
                <TableHead className="font-semibold text-foreground">Repassar taxas</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Nenhum dado adicionado.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.name}</TableCell>
                    <TableCell>{ticket.quantity || "∞"}</TableCell>
                    <TableCell>{Number(ticket.price) === 0 ? "Grátis" : `R$ ${ticket.price}`}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold">
                        {ticket.status || "Ativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.visibility || "Público"}</TableCell>
                    <TableCell>{ticket.repass ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Exibindo 1 de 0 páginas</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled>
              <span>‹</span>
            </Button>
            <Button variant="default" size="icon" className="w-8 h-8 rounded-md text-xs">
              1
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" disabled>
              <span>›</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {ticketType === "paid" ? "Novo ingresso pago" : "Novo ingresso gratuito"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do ingresso</Label>
              <Input placeholder="Ex: Ingresso VIP" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" placeholder="100" />
              </div>
              {ticketType === "paid" && (
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input type="number" placeholder="50,00" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label>Repassar taxas ao comprador</Label>
              <Switch />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => setModalOpen(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
