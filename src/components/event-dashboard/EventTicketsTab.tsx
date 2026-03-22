import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  event: any;
}

export const EventTicketsTab = ({ event }: Props) => {
  const tickets = event.tickets || event.details?.tickets || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Gestão de Ingressos</h3>
        <Button className="gap-2 bg-primary hover:bg-primary/90 font-semibold">
          <Plus className="w-4 h-4" /> Novo Ingresso
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Quantidade</TableHead>
                <TableHead className="font-semibold">Preço</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Visibilidade</TableHead>
                <TableHead className="font-semibold">Repassar Taxas</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum ingresso cadastrado.
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
        </CardContent>
      </Card>
    </div>
  );
};
