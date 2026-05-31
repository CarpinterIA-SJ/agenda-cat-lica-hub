import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QRCodeCanvas } from "qrcode.react";
import {
  ExternalLink,
  Pencil,
  MoreHorizontal,
  Info,
  Globe,
  Ticket,
  CreditCard,
  ClipboardList,
  MessageSquare,
  History,
  Wallet,
  Download,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { useEvent } from "@/hooks/use-events";
import { useRegistrations } from "@/hooks/use-registrations";

const OrganizerEventDashboardPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { data: event } = useEvent(id);
  const { data: registrations = [] } = useRegistrations(id);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateSlug, setDuplicateSlug] = useState("");
  const [syncCategory, setSyncCategory] = useState("");
  const [syncField, setSyncField] = useState("");

  const eventName = event?.name ?? "Evento";
  const eventDateLabel = event?.start_at
    ? new Date(event.start_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Data a definir";
  const eventUrl = event?.slug ? `${window.location.origin}/evento/${event.slug}` : "";
  const totalParticipants = registrations.length;

  const chartData = [
    { name: "20/03", value: 0 },
    { name: "21/03", value: 0 },
    { name: "22/03", value: 1 },
    { name: "23/03", value: 1 },
    { name: "24/03", value: 1 },
    { name: "25/03", value: 2 },
    { name: "26/03", value: 2 },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast({ title: "Link copiado!", description: "O link do evento foi copiado para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Copie manualmente o link.", variant: "destructive" });
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#qr-code-canvas canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "qrcode-evento.png";
      a.click();
    }
  };

  const tabs = [
    { icon: Info, label: "Informações gerais", value: "info" },
    { icon: Globe, label: "Página do evento", value: "pagina" },
    { icon: Ticket, label: "Ingressos", value: "ingressos" },
    { icon: CreditCard, label: "Pagamento", value: "pagamento" },
    { icon: ClipboardList, label: "Formulário de inscrição", value: "formulario" },
    { icon: MessageSquare, label: "Mensagens", value: "mensagens" },
  ];

  const handleTabChange = (value: string) => {
    const routes: Record<string, string> = {
      info: `/organizador/evento/${id}/configuracoes`,
      pagina: `/organizador/evento/${id}/configuracoes/pagina`,
      ingressos: `/organizador/evento/${id}/ingressos`,
      pagamento: `/organizador/evento/${id}/configuracoes/pagamento`,
      formulario: `/organizador/evento/${id}/configuracoes/formulario`,
      mensagens: `/organizador/evento/${id}/configuracoes/mensagem`,
    };
    if (routes[value]) navigate(routes[value]);
  };

  return (
    <div className="space-y-6" style={{ background: "#F9FAFB", minHeight: "100%" }}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-wide">
              {eventName}
            </h1>
            <ExternalLink className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{eventDateLabel}</p>
        </div>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          Voltar para os meus eventos
        </Button>
      </div>

      {/* Alert Banner */}
      <div className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-[hsl(30,100%,97%)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[hsl(30,80%,25%)]">
          Atualize os seus dados cadastrais na Guardião Eventos para liberar todos os recursos do painel.
        </p>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/minha-conta")}>
          Atualizar dados
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="info" onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start gap-0 rounded-lg border bg-card p-1 h-auto flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Detalhes do Evento</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Badge className="border-primary/20 bg-primary/10 text-primary">Publicado</Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground">Público</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
                onClick={() => navigate(`/organizador/evento/${id}/configuracoes`)}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDuplicateOpen(true)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sharing Section */}
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LinkIcon className="w-4 h-4 text-primary" />
                Compartilhamento
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground break-all">{eventUrl}</span>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                  onClick={handleCopy}
                >
                  Copiar link
                </Button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">QR Code do Evento</p>
                <p className="text-xs text-muted-foreground">Compartilhe ou utilize no check-in.</p>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/5"
                  onClick={handleDownloadQR}
                >
                  <Download className="w-4 h-4" />
                  Baixar qr-code
                </Button>
              </div>
              <div id="qr-code-canvas" className="flex items-center justify-center rounded-lg border bg-white p-3">
                <QRCodeCanvas value={eventUrl} size={96} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sincronização com CRM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie os dados de inscritos para o seu CRM e mantenha tudo organizado em tempo real.
              </p>
              <Badge className="border-[hsl(340,80%,85%)] bg-[hsl(340,80%,95%)] text-[hsl(340,80%,40%)]">Não sincronizado</Badge>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setSyncOpen(true)}
              >
                Sincronizar
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">App de Check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utilize o app de validação Guardião Eventos para garantir entradas rápidas e seguras.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 rounded-md bg-black px-3 py-2 text-center text-xs font-semibold text-white cursor-pointer hover:bg-black/90 transition">
                  Google Play
                </div>
                <div className="flex-1 rounded-md bg-black px-3 py-2 text-center text-xs font-semibold text-white cursor-pointer hover:bg-black/90 transition">
                  App Store
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Total de participantes</CardTitle>
            <History className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{totalParticipants}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Disponível para repasse</CardTitle>
            <Wallet className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">R$ 0,00</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ingressos</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 2]} ticks={[0, 1, 2]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Duplicate Modal */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Evento</DialogTitle>
            <DialogDescription>Preencha os dados para criar uma cópia deste evento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do evento</Label>
              <Input
                placeholder="Digite o nome do evento"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço da página</Label>
              <Input
                placeholder="meu-evento"
                value={duplicateSlug}
                onChange={(e) => setDuplicateSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                toast({ title: "Evento duplicado!", description: "O evento foi duplicado com sucesso." });
                setDuplicateOpen(false);
              }}
            >
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync CRM Modal */}
      <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar com CRM</DialogTitle>
            <DialogDescription>Configure a integração para enviar os dados ao seu CRM.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria do evento</Label>
              <Select value={syncCategory} onValueChange={setSyncCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retiros">Retiros</SelectItem>
                  <SelectItem value="congressos">Congressos e Seminários</SelectItem>
                  <SelectItem value="cursos">Cursos e Workshops</SelectItem>
                  <SelectItem value="encontros">Encontros de Formação</SelectItem>
                  <SelectItem value="eventos">Eventos Diversos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campo de integração único</Label>
              <Select value={syncField} onValueChange={setSyncField}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                toast({ title: "Sincronização iniciada!", description: "Os dados serão enviados ao CRM." });
                setSyncOpen(false);
              }}
            >
              Sincronizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizerEventDashboardPage;
