import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Copy,
  Download,
  QrCode,
  Users,
  Wallet,
  RefreshCw,
  Smartphone,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const chartData = [
  { date: "16/03", value: 0 },
  { date: "17/03", value: 0 },
  { date: "18/03", value: 0 },
  { date: "19/03", value: 0 },
  { date: "20/03", value: 0 },
  { date: "21/03", value: 0 },
  { date: "22/03", value: 0 },
];

interface Props {
  event: any;
}

export const EventDetailsTab = ({ event }: Props) => {
  const shareLink = `https://evento.guardianeventos.com/${event.custom_url || event.name?.toLowerCase().replace(/\s+/g, "") || "meuevent"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado!");
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">
                Atualize os seus dados cadastrais na Guardião Eventos
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Esse cadastro é necessário para solicitar repasses de seu evento. Em caso de dúvidas, acesse:{" "}
                <a href="#" className="text-primary underline">Central de Ajuda</a>
              </p>
            </div>
          </div>
          <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-100 font-semibold shrink-0">
            Atualizar dados
          </Button>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Detalhes do evento</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground"><Copy className="w-4 h-4" /></Button>
              <Button variant="outline" className="gap-2 text-sm font-medium">
                <Pencil className="w-4 h-4" /> Editar
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreVertical className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-semibold">
                    {event.status || "Publicado"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Visibilidade</p>
                  <p className="text-sm font-medium">{event.visibility === "private" ? "Privado" : "Público"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold mb-2">Compartilhar</p>
                <p className="text-xs text-muted-foreground mb-2 break-all">{shareLink}</p>
                <Button onClick={handleCopyLink} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                  <Copy className="w-3 h-3" /> Copiar link
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-muted/30 border rounded-xl flex items-center justify-center">
                <QrCode className="w-20 h-20 text-muted-foreground/50" />
              </div>
              <Button variant="outline" size="sm" className="text-primary border-primary/30 hover:bg-primary/5 font-semibold gap-2">
                <Download className="w-3 h-3" /> Baixar QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CRM + Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Sincronização com CRM</h3>
            <p className="text-sm text-muted-foreground">
              Mantenha tudo organizado! Envie os dados dos participantes para o CRM da plataforma e acompanhe as informações do seu evento num só lugar.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">STATUS</p>
                <Badge variant="secondary" className="bg-red-100 text-red-600 hover:bg-red-100 mt-1 font-semibold text-[10px]">
                  Não sincronizado
                </Badge>
              </div>
              <Button variant="outline" className="gap-2 font-semibold border-primary/30 text-primary hover:bg-primary/5">
                <RefreshCw className="w-4 h-4" /> Sincronizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">App de check-in</h3>
            <p className="text-sm text-muted-foreground">
              Baixe o app de check-in e use para validar ingressos e agilizar a entrada dos participantes no dia do evento.
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 px-4 bg-foreground text-card rounded-lg flex items-center gap-2 text-xs font-semibold">
                <Smartphone className="w-4 h-4" /> Google Play
              </div>
              <div className="h-10 px-4 bg-foreground text-card rounded-lg flex items-center gap-2 text-xs font-semibold">
                <Smartphone className="w-4 h-4" /> App Store
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique <a href="#" className="text-primary underline font-semibold">AQUI</a> para saber como funciona!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de participantes</p>
              <p className="text-2xl font-bold text-foreground">{event.attendees || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponível para repasse</p>
              <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-foreground mb-6 border-b-2 border-primary pb-2 inline-block">
            Ingressos
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
