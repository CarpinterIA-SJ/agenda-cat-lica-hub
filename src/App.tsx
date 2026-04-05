import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useNavigate, useParams, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import ExploreEventsPage, { PublicEventPage } from "./pages/ExploreEventsPage";
import SupportPage from "./pages/SupportPage";
import OrganizerEventsPage from "./pages/OrganizerEventsPage";
import CRMPage from "./pages/CRMPage";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { QRCodeCanvas } from "qrcode.react";
import { PatternFormat } from "react-number-format";
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
  MapPin,
  Video,
  Shuffle,
  Locate,
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  Tag,
  CheckSquare,
  FileText,
  Filter,
  CheckCircle2,
  Percent,
  HandCoins,
  Heading1,
  Heading2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Upload,
  Info as InfoIcon,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TiptapLink from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children ? <>{children}</> : <Outlet />;
};

const RoleRoute = ({ children, requiredRole }: { children?: React.ReactNode; requiredRole?: 'organizer' | 'participant' }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!role) return <Navigate to="/role-select" replace />;
  if (requiredRole && role !== requiredRole) {
    const fallback = role === 'organizer' ? "/organizador/home" : "/participante/meus-ingressos";
    return <Navigate to={fallback} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};

const OrganizerEventNewPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("informacoes");

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="w-full border-b bg-white">
        <div className="w-full px-6 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Meus eventos &gt; Criar evento</p>
            <h1 className="text-2xl font-semibold text-foreground">Criar evento</h1>
          </div>
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => navigate("/organizador/meus-eventos")}
          >
            Voltar para os eventos
          </Button>
        </div>
      </div>

      <div className="w-full px-6 py-8 space-y-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-white border rounded-lg">
            <TabsTrigger value="informacoes" className="gap-2 data-[state=active]:text-emerald-800">
              <Info className="h-4 w-4" />
              Informações gerais
            </TabsTrigger>
            <TabsTrigger value="pagina" className="gap-2">
              <Globe className="h-4 w-4" />
              Página do evento
            </TabsTrigger>
            <TabsTrigger value="ingressos" className="gap-2">
              <Ticket className="h-4 w-4" />
              Ingressos
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="formulario" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Formulário de inscrição
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de evento</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="presencial" className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "presencial", label: "Evento presencial", icon: MapPin },
                  { value: "online", label: "Evento online", icon: Video },
                  { value: "hibrido", label: "Híbrido", icon: Shuffle },
                ].map((item) => (
                  <label
                    key={item.value}
                    htmlFor={item.value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-emerald-600"
                  >
                    <RadioGroupItem id={item.value} value={item.value} />
                    <item.icon className="h-5 w-5 text-emerald-700" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Select>
                  <SelectTrigger className="md:max-w-sm">
                    <SelectValue placeholder="Selecione o organizador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guardiao">Guardião Eventos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">+ Adicionar organizador</Button>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Notificações sobre vendas e suporte serão enviadas por WhatsApp e E-mail.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Whatsapp de suporte</label>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="+55" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="55">+55</SelectItem>
                        <SelectItem value="351">+351</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="(00) 00000-0000" inputMode="tel" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail de suporte</label>
                  <Input placeholder="suporte@guardiaoeventos.com" type="email" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do evento</label>
                <Input placeholder="Informe o nome do evento" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Endereço da página</label>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex flex-1 items-center rounded-md border border-input bg-white">
                    <span className="px-3 text-sm text-muted-foreground">guardiaoeventos.com/</span>
                    <Input className="border-0 focus-visible:ring-0" placeholder="meu-evento" />
                  </div>
                  <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">Verificar</Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria do evento</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="religioso">Religioso</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nomenclatura</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Ex: Inscrição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inscricao">Inscrição</SelectItem>
                      <SelectItem value="ingresso">Ingresso</SelectItem>
                      <SelectItem value="participacao">Participação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visibilidade do evento</label>
                <RadioGroup defaultValue="publico" className="grid gap-3 md:grid-cols-2">
                  <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="publico" />
                      <span className="text-sm font-medium">Público</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Aparece para todos na Guardião Eventos.</span>
                  </label>
                  <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="privado" />
                      <span className="text-sm font-medium">Privado</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Somente quem tiver o link pode acessar.</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Início do evento</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="dd/mm/aaaa" inputMode="numeric" />
                    <Input placeholder="hh:mm" inputMode="numeric" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Término do evento</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="dd/mm/aaaa" inputMode="numeric" />
                    <Input placeholder="hh:mm" inputMode="numeric" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local do evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Buscar endereço" />
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-slate-100">
                <Locate className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termos de uso</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <Checkbox />
                Concordo com os termos de uso e políticas de privacidade da plataforma
              </label>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800">Criar evento e continuar</Button>
        </div>
      </div>
    </div>
  );
};

const OrganizerEventDashboardPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const eventUrl = "https://guardiaoeventos.com/evento/1";
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <ExternalLink className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-sm text-muted-foreground">21/10/2026 às 12:00 até 22/10/2026 às 18:00</p>
        </div>
        <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("/organizador/meus-eventos")}>
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-orange-900">
          Atualize os seus dados cadastrais na Guardião Eventos para liberar todos os recursos do painel.
        </p>
        <Button className="bg-emerald-700 text-white hover:bg-emerald-800">Atualizar dados</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 border rounded-lg divide-y md:divide-y-0 md:divide-x bg-card">
        {[
          { icon: Info, label: "Informações gerais" },
          { icon: Globe, label: "Página do evento" },
          { icon: Ticket, label: "Ingressos", route: `/organizador/evento/${id}/ingressos` },
          { icon: CreditCard, label: "Pagamento" },
          { icon: ClipboardList, label: "Formulário de inscrição" },
          { icon: MessageSquare, label: "Mensagens" },
        ].map((item) =>
          item.route ? (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-2 p-4 text-center transition hover:bg-slate-50"
            >
              <item.icon className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </button>
          ) : (
            <div key={item.label} className="flex flex-col items-center gap-2 p-4 text-center">
              <item.icon className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </div>
          )
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Detalhes do Evento</CardTitle>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700">Publicado</Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">Público</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <Button variant="ghost" size="icon" className="text-emerald-700">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LinkIcon className="w-4 h-4 text-emerald-700" />
                Compartilhamento
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground break-all">{eventUrl}</span>
                <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={handleCopy}>
                  Copiar link
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">QR Code do Evento</p>
                <p className="text-xs text-muted-foreground">Compartilhe ou utilize no check-in.</p>
                <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                  <Download className="w-4 h-4" />
                  Baixar qr-code
                </Button>
              </div>
              <div className="flex items-center justify-center rounded-lg border bg-white p-3">
                <QRCodeCanvas value={eventUrl} size={96} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sincronização com CRM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Envie os dados de inscritos para o seu CRM e mantenha tudo organizado em tempo real.
              </p>
              <Badge className="border-pink-200 bg-pink-100 text-pink-700">Não sincronizado</Badge>
              <Button className="w-full bg-emerald-700 text-white hover:bg-emerald-800">Sincronizar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">App de Check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Utilize o app de validação Guardião Eventos para garantir entradas rápidas e seguras.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 rounded-md bg-black px-3 py-2 text-center text-xs font-semibold text-white">Google Play</div>
                <div className="flex-1 rounded-md bg-black px-3 py-2 text-center text-xs font-semibold text-white">App Store</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Total de participantes</CardTitle>
            <History className="w-5 h-5 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Disponível para repasse</CardTitle>
            <Wallet className="w-5 h-5 text-emerald-700" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">R$ 0,00</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingressos</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 2]} ticks={[0, 1, 2]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const OrganizerEventPreviewPage = () => {
  const navigate = useNavigate();
  const countdown = [
    { value: "207", label: "Dias" },
    { value: "13", label: "Horas" },
    { value: "43", label: "Minutos" },
    { value: "15", label: "Segundos" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-slate-900">Visualização do evento</span>
          </div>
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => navigate("/organizador/meus-eventos")}>
            Voltar para meus eventos
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  21/10/2026 às 12:00 até 22/10/2026 às 18:00
                </span>
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Evento online
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900">Políticas do evento</h2>
              <p className="text-sm text-slate-500">
                O cancelamento para pedidos que contém inscrições pagas serão aceitos até 7 dias após a data da compra,
                considerando que a solicitação seja submetida em até 24 horas antes do início do evento.
              </p>
              <button className="text-sm font-medium text-primary hover:underline">Saiba mais</button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {countdown.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Inscrição</h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                Nenhum ingresso cadastrado entre em contato com um organizador.
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Realização</h3>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="h-10 w-10 rounded-lg bg-slate-400 text-white flex items-center justify-center font-semibold">FC</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</p>
                  <p className="text-xs text-slate-500">vsv\sv\s</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                Falar com o organizador
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Formas de pagamento</h4>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {['Visa', 'Mastercard', 'Elo', 'American Express', 'Boleto', 'Pix'].map((item) => (
                <span key={item} className="rounded-full bg-slate-100 px-3 py-1">{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Certificados</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <Clock className="w-4 h-4" />
              SITE 100% SEGURO
            </div>
            <p className="text-xs text-slate-500">Seus dados protegidos e transações seguras.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">Precisa de ajuda?</h4>
            <p className="text-xs text-slate-500">Central de atendimento Guardião Eventos.</p>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              Central de atendimento
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const OrganizerEventIngressosPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [dialogType, setDialogType] = useState<"pago" | "gratuito" | null>(null);
  const eventName = "FABRICIO CHRISTIAN DA SILVA CAVALCANTE";
  const tabs = [
    { label: "Informações gerais", icon: Info },
    { label: "Página do evento", icon: Globe },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos`, active: true },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare },
  ];
  const totalPages = 0;
  const currentPage = 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <button
            onClick={() => navigate("/organizador/meus-eventos")}
            className="text-sm text-muted-foreground hover:text-[#004d00]"
          >
            Meus eventos &gt; {eventName}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}
          >
            Voltar para o painel do evento
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}
          >
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "bg-emerald-50 text-[#004d00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="bg-white rounded-2xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Ingressos</CardTitle>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="bg-[#004d00] text-white hover:bg-[#003a00]"
              onClick={() => setDialogType("pago")}
            >
              + Ingresso pago
            </Button>
            <Button
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
              onClick={() => setDialogType("gratuito")}
            >
              + Ingresso gratuito
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar..." />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Quantidade</th>
                  <th className="px-4 py-3 text-left font-medium">Preço</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Visibilidade</th>
                  <th className="px-4 py-3 text-left font-medium">Repassar taxas</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo {currentPage} de {totalPages} páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                {currentPage}
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!dialogType} onOpenChange={(open) => !open && setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Adicionar ingresso {dialogType === "pago" ? "pago" : "gratuito"}
            </DialogTitle>
            <DialogDescription>Preencha os dados do novo ingresso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input placeholder="Nome do ingresso" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantidade</label>
              <Input placeholder="0" type="number" />
            </div>
            {dialogType === "pago" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Preço</label>
                <Input placeholder="R$ 0,00" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancelar
            </Button>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Salvar ingresso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OrganizerEventParticipantesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const participants: {
    name: string;
    code: string;
    date: string;
    ticket: string;
    status: string;
  }[] = [];

  const filteredParticipants = participants.filter((participant) => {
    const query = search.toLowerCase();
    return (
      participant.name.toLowerCase().includes(query) ||
      participant.code.toLowerCase().includes(query) ||
      participant.ticket.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <ExternalLink className="h-4 w-4 text-[#004d00]" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-[#004d00]" />
            21/10/2026 às 12:00 até 22/10/2026 às 18:00
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-orange-100 p-2 text-orange-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-sm text-orange-900">
            Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para solicitar repasses de
            seu evento. Em caso de dúvidas, acesse: <button className="font-semibold underline">Central de Ajuda</button>
          </p>
        </div>
        <Button className="bg-orange-500 text-white hover:bg-orange-600">Atualizar dados</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Participantes confirmados (pagamento realizado)",
            value: "0",
            icon: Users,
            color: "bg-blue-50 text-blue-600",
          },
          {
            title: "Participantes pendentes (aguardando pagamento)",
            value: "0",
            icon: Tag,
            color: "bg-rose-50 text-rose-600",
          },
          {
            title: "Check-ins realizados",
            value: "0",
            icon: CheckSquare,
            color: "bg-emerald-50 text-emerald-600",
          },
        ].map((card) => (
          <Card key={card.title} className="bg-white rounded-2xl border border-slate-200">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{card.title}</p>
                <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-2xl border border-slate-200">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Lista de participantes</CardTitle>
            </div>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
            <FileText className="h-4 w-4" />
            Exportar relatório
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Buscar..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Data de inscrição</th>
                  <th className="px-4 py-3 text-left font-medium">Ingresso</th>
                  <th className="px-4 py-3 text-left font-medium">Status pedido</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                      Nenhum dado adicionado.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr key={participant.code} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{participant.name}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.code}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.date}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.ticket}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.status}</td>
                      <td className="px-4 py-3 text-slate-500">-</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo 1 de 0 páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                1
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OrganizerEventFilaDeEsperaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <LinkIcon className="h-4 w-4 text-[#004d00]" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-[#004d00]" />
            21/10/2026 às 12:00 até 22/10/2026 às 18:00
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-orange-100 p-2 text-orange-700">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="text-sm text-orange-900">
            Atualize os seus dados cadastrais na Guardião Eventos para liberar todos os recursos do painel.
          </p>
        </div>
        <Button className="bg-orange-500 text-white hover:bg-orange-600">Atualizar dados</Button>
      </div>

      <Card className="bg-white rounded-2xl border border-slate-200">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Fila de espera</CardTitle>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">+ Adicionar</Button>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <FileText className="h-4 w-4" />
              Exportar relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Cadastrado em</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo 1 de 0 páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                1
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OrganizerEventCuponsPage = () => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold uppercase text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <ExternalLink className="h-4 w-4 text-[#004d00]" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-[#004d00]" />
            21/10/2026 às 12:00 até 22/10/2026 às 18:00
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-orange-900">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para solicitar repasses de seu
          evento. Em caso de dúvidas, acesse: <span className="font-semibold underline">Central de Ajuda</span>
        </p>
        <Button className="bg-orange-500 text-white hover:bg-orange-600">Atualizar dados</Button>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Cupons de desconto</CardTitle>
            </div>
          </div>
          <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={() => setOpenDialog(true)}>
            + Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Modo</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold">Máximo</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo 1 de 0 páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                1
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar cupom de desconto</DialogTitle>
            <DialogDescription>Preencha os dados do novo cupom.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Código do Cupom</label>
              <Input placeholder="EX: PROMO10" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Modo</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Porcentagem</SelectItem>
                  <SelectItem value="fixo">Valor Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Valor</label>
              <Input placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Limite de Uso (Máximo)</label>
              <Input placeholder="0" type="number" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Salvar cupom</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OrganizerEventFinanceiroPage = () => {
  const navigate = useNavigate();

  const stats = [
    {
      label: "Total líquido",
      value: "R$ 0,00",
      icon: CheckCircle2,
      colors: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total pendentes",
      value: "R$ 0,00",
      icon: AlertTriangle,
      colors: "bg-orange-50 text-orange-600",
    },
    {
      label: "Total cancelados",
      value: "R$ 0,00",
      icon: Percent,
      colors: "bg-red-50 text-red-600",
    },
    {
      label: "Aguardando liberação",
      value: "R$ 0,00",
      icon: Clock,
      colors: "bg-orange-50 text-orange-600",
    },
    {
      label: "Total a receber",
      value: "R$ 0,00",
      icon: Wallet,
      colors: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total recebido",
      value: "R$ 0,00",
      icon: HandCoins,
      colors: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold uppercase text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <ExternalLink className="h-4 w-4 text-[#004d00]" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-[#004d00]" />
            21/10/2026 às 12:00 até 22/10/2026 às 18:00
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-orange-900">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para solicitar repasses de seu
          evento...
        </p>
        <Button className="bg-orange-500 text-white hover:bg-orange-600">Atualizar dados</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm transition hover:shadow-md"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.colors}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Histórico de transações</CardTitle>
            </div>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">
            <FileText className="h-4 w-4" />
            Exportar relatório
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cod Pedido</th>
                  <th className="px-4 py-3 text-left font-semibold">Nome responsável</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Data</th>
                  <th className="px-4 py-3 text-left font-semibold">Forma de pagamento</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor líquido</th>
                  <th className="px-4 py-3 text-left font-semibold">Status Pagamento</th>
                  <th className="px-4 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={8} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo 1 de 0 páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                1
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OrganizerEventRepassePage = () => {
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold uppercase text-foreground">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</h1>
            <ExternalLink className="h-4 w-4 text-[#004d00]" />
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-[#004d00]" />
            21/10/2026 às 12:00 até 22/10/2026 às 18:00
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => navigate("/organizador/meus-eventos")}
        >
          Voltar para os meus eventos
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-orange-900">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para solicitar repasses de seu evento...
        </p>
        <Button className="bg-orange-500 text-white hover:bg-orange-600">Atualizar dados</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Total a receber", value: "R$ 0,00", icon: Wallet, color: "bg-emerald-50 text-emerald-700" },
          { title: "Total recebido", value: "R$ 0,00", icon: HandCoins, color: "bg-emerald-50 text-emerald-600" },
          { title: "Aguardando liberação", value: "R$ 0,00", icon: Clock, color: "bg-orange-50 text-orange-600" },
        ].map((stat) => (
          <Card key={stat.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase text-slate-400">Financeiro</span>
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Repasses efetuados</CardTitle>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
              onClick={() => setOpenDialog(true)}
            >
              Solicitar repasse
            </Button>
            <Button
              variant="outline"
              className="border-emerald-100 bg-emerald-50 text-emerald-300 cursor-not-allowed"
            >
              Solicitar antecipação
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Pesquisar..." />
            </div>
            <Button variant="outline" className="border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Solicitação</th>
                  <th className="px-4 py-3 text-left font-semibold">Data da transferência</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor líquido</th>
                  <th className="px-4 py-3 text-left font-semibold">Ver Comprovante</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo 1 de 0 páginas</span>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronLeft className="h-4 w-4 mx-auto" />
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#004d00] text-xs font-semibold text-white">
                1
              </span>
              <button className="h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#004d00]">
                <ChevronRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar repasse</DialogTitle>
            <DialogDescription>Informe os dados da conta bancária para receber o saldo do evento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              <span>Saldo disponível</span>
              <span className="font-semibold">R$ 0,00</span>
            </div>
            <div className="grid gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Banco</label>
                <Input placeholder="Nome do banco" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Agência</label>
                  <Input placeholder="0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Conta</label>
                  <Input placeholder="00000-0" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Titular</label>
                <Input placeholder="Nome completo" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Enviar solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const OrganizerEventConfiguracoesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [eventName, setEventName] = useState("FABRICIO CHRISTIAN DA SILVA CAVALCANTE");
  const [eventType, setEventType] = useState("online");
  const [organizer, setOrganizer] = useState("guardiao");
  const [ddi, setDdi] = useState("+55");
  const [whatsapp, setWhatsapp] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [slug, setSlug] = useState("fabricio-christian");
  const [category, setCategory] = useState("religioso");
  const [visibility, setVisibility] = useState("publico");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;
      const { data, error } = await (supabase as any)
        .from("events")
        .select("name, slug, category, visibility, start_date, end_date, support_whatsapp, support_email, event_type")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return;
      if (data.name) setEventName(data.name);
      if (data.slug) setSlug(data.slug);
      if (data.category) setCategory(data.category);
      if (data.visibility) setVisibility(data.visibility);
      if (data.event_type) setEventType(data.event_type);
      if (data.support_email) setSupportEmail(data.support_email);
      if (data.support_whatsapp) setWhatsapp(data.support_whatsapp.replace("+", ""));
      if (data.start_date) {
        const start = new Date(data.start_date);
        if (!Number.isNaN(start.getTime())) {
          setStartDate(start.toISOString().slice(0, 10));
          setStartTime(start.toISOString().slice(11, 16));
        }
      }
      if (data.end_date) {
        const end = new Date(data.end_date);
        if (!Number.isNaN(end.getTime())) {
          setEndDate(end.toISOString().slice(0, 10));
          setEndTime(end.toISOString().slice(11, 16));
        }
      }
    };

    loadEvent();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const start = startDate ? new Date(`${startDate}T${startTime || "00:00"}`).toISOString() : null;
    const end = endDate ? new Date(`${endDate}T${endTime || "00:00"}`).toISOString() : null;

    const { error } = await (supabase as any)
      .from("events")
      .update({
        name: eventName,
        slug,
        category,
        visibility,
        event_type: eventType,
        support_whatsapp: whatsapp ? `${ddi}${whatsapp}` : null,
        support_email: supportEmail,
        start_date: start,
        end_date: end,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar o evento." });
      return;
    }

    toast({ title: "Dados atualizados", description: "As informações do evento foram salvas." });
  };

  const tabs = [
    { label: "Informações gerais", icon: Info, active: true },
    { label: "Página do evento", icon: Globe, route: `/organizador/evento/${id}/configuracoes/pagina` },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <button
            onClick={() => navigate("/organizador/meus-eventos")}
            className="text-sm text-muted-foreground hover:text-[#004d00]"
          >
            Meus eventos &gt; {eventName}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}
          >
            Voltar para o painel do evento
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}
          >
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "bg-emerald-50 text-[#004d00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Tipo de evento</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={eventType} onValueChange={setEventType} className="grid gap-3 md:grid-cols-3">
            {[
              { value: "presencial", label: "Evento presencial", icon: MapPin },
              { value: "online", label: "Evento online", icon: Video },
              { value: "hibrido", label: "Híbrido", icon: Shuffle },
            ].map((item) => (
              <label
                key={item.value}
                htmlFor={`tipo-${item.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-[#004d00]"
              >
                <RadioGroupItem id={`tipo-${item.value}`} value={item.value} />
                <item.icon className="h-5 w-5 text-[#004d00]" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Organizador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Select value={organizer} onValueChange={setOrganizer}>
              <SelectTrigger className="md:max-w-sm">
                <SelectValue placeholder="Selecione o organizador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guardiao">Guardião Eventos</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">+ Adicionar organizador</Button>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            Informações de contato serão usadas para notificações de WhatsApp e E-mail sobre vendas e suporte.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Whatsapp de suporte do evento</label>
              <div className="flex gap-2">
                <Select value={ddi} onValueChange={setDdi}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="+55" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+55">+55</SelectItem>
                    <SelectItem value="+351">+351</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail de suporte</label>
              <Input
                placeholder="suporte@guardiaoeventos.com"
                type="email"
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do evento</label>
            <Input
              placeholder="Informe o nome do evento"
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço da página</label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 items-center rounded-md border border-input bg-white">
                <span className="px-3 text-sm text-muted-foreground">guardiaoeventos.com/</span>
                <Input
                  className="border-0 focus-visible:ring-0"
                  placeholder="meu-evento"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                />
              </div>
              <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                Verificar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria do evento</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="religioso">Congressos</SelectItem>
                  <SelectItem value="seminarios">Seminários</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidade do evento</label>
              <RadioGroup value={visibility} onValueChange={setVisibility} className="grid gap-3">
                <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="publico" />
                    <span className="text-sm font-medium">Público</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Aparece para todos na Guardião Eventos.</span>
                </label>
                <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="privado" />
                    <span className="text-sm font-medium">Privado</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Somente quem tiver o link pode acessar.</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Início do evento</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="time"
                    className="pl-9"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Término do evento</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="time"
                    className="pl-9"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex justify-end">
          <Button
            className="bg-[#004d00] text-white hover:bg-[#003a00]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const OrganizerEventPaginaConfiguracoesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const eventName = "FABRICIO CHRISTIAN DA SILVA CAVALCANTE";

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TiptapLink.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Descreva o evento com detalhes..." }),
    ],
    content: "",
  });

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, active: true },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare },
  ];

  const toolbarButton = (active?: boolean) =>
    `flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition ${
      active ? "border-emerald-200 bg-emerald-50 text-[#004d00]" : "border-slate-200 text-slate-500 hover:text-[#004d00]"
    }`;

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <button
            onClick={() => navigate("/organizador/meus-eventos")}
            className="text-sm text-muted-foreground hover:text-[#004d00]"
          >
            Meus eventos &gt; {eventName}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}
          >
            Voltar para o painel do evento
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}
          >
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "bg-emerald-50 text-[#004d00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Descrição do evento</CardTitle>
          <p className="text-sm text-muted-foreground">Conte mais sobre o evento, programação, palestrantes e detalhes.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 border border-slate-200 rounded-lg p-2">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={toolbarButton(editor?.isActive("heading", { level: 1 }))}
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={toolbarButton(editor?.isActive("heading", { level: 2 }))}
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={toolbarButton(editor?.isActive("bold"))}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={toolbarButton(editor?.isActive("italic"))}
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={toolbarButton(editor?.isActive("underline"))}
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={toolbarButton(editor?.isActive("bulletList"))}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={toolbarButton(editor?.isActive("orderedList"))}
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              className={toolbarButton(editor?.isActive({ textAlign: "left" }))}
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              className={toolbarButton(editor?.isActive({ textAlign: "center" }))}
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              className={toolbarButton(editor?.isActive({ textAlign: "right" }))}
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton()}>
              <Link2 className="h-4 w-4" />
            </button>
            <button type="button" className={toolbarButton()}>
              <ImageIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-[220px] rounded-lg border border-slate-200 bg-white p-4">
            <EditorContent editor={editor} className="prose max-w-none" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Imagens</CardTitle>
          <p className="text-sm text-muted-foreground">Adicione as imagens de divulgação que aparecerão na página pública.</p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          [{
            title: "Imagem da divulgação mobile",
            details: "400px x 300px · JPEG ou PNG · até 3MB",
          }, {
            title: "Imagem da divulgação web",
            details: "1400px x 733px · JPEG ou PNG · até 5MB",
          }].map((item) => (
            <div key={item.title} className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#004d00]">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.details}</p>
              </div>
              <Button variant="outline" className="mx-auto border-slate-300 text-slate-600 hover:bg-white">
                Selecionar imagem
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle>Políticas do evento</CardTitle>
          <p className="text-sm text-muted-foreground">Defina regras de cancelamento e edição de participantes.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-2">
              <span>Permite solicitar cancelamento de pedido em até</span>
              <Input type="number" className="h-8 w-20" placeholder="0" />
              <span>dias após a compra e no mínimo</span>
              <Input type="number" className="h-8 w-20" placeholder="0" />
              <span>horas antes do início do evento.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span>Permite edição de participantes no mínimo</span>
              <Input type="number" className="h-8 w-20" placeholder="0" />
              <span>horas antes do início do evento.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
            <InfoIcon className="mt-0.5 h-4 w-4 text-[#004d00]" />
            <p>
              De acordo com o CDC Art. 49, compras online têm direito de arrependimento em até 7 dias. Ajuste as políticas
              para respeitar esse prazo mínimo.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Salvar</Button>
      </div>
    </div>
  );
};

const OrganizerEventPagamentoConfiguracoesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const eventName = "FABRICIO CHRISTIAN DA SILVA CAVALCANTE";
  const [creditEnabled, setCreditEnabled] = useState(true);
  const [pixEnabled, setPixEnabled] = useState(false);
  const [boletoEnabled, setBoletoEnabled] = useState(false);
  const [pixPrazo, setPixPrazo] = useState("30");
  const [pixUnit, setPixUnit] = useState("minutos");
  const [boletoPrazo, setBoletoPrazo] = useState("2");
  const [autoCancel, setAutoCancel] = useState(true);

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, route: `/organizador/evento/${id}/configuracoes/pagina` },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, active: true },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <button
            onClick={() => navigate("/organizador/meus-eventos")}
            className="text-sm text-muted-foreground hover:text-[#004d00]"
          >
            Meus eventos &gt; {eventName}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}
          >
            Voltar para o painel do evento
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}
          >
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "bg-emerald-50 text-[#004d00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Formas de pagamento disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Cartão de crédito</span>
            <Switch
              checked={creditEnabled}
              onCheckedChange={setCreditEnabled}
              className="data-[state=checked]:bg-[#004d00]"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Pix</span>
              <Switch
                checked={pixEnabled}
                onCheckedChange={setPixEnabled}
                className="data-[state=checked]:bg-[#004d00]"
              />
            </div>
            {pixEnabled && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Prazo para pagamento</label>
                  <Input
                    type="number"
                    value={pixPrazo}
                    onChange={(event) => setPixPrazo(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Unidade</label>
                  <Select value={pixUnit} onValueChange={setPixUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos</SelectItem>
                      <SelectItem value="horas">Horas</SelectItem>
                      <SelectItem value="dias">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Boleto</span>
              <Switch
                checked={boletoEnabled}
                onCheckedChange={setBoletoEnabled}
                className="data-[state=checked]:bg-[#004d00]"
              />
            </div>
            {boletoEnabled && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Prazo para pagamento</label>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    value={boletoPrazo}
                    onChange={(event) => setBoletoPrazo(event.target.value)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">dias</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
            <InfoIcon className="mt-0.5 h-4 w-4 text-[#004d00]" />
            <div className="space-y-2">
              <p className="font-medium">Como funciona os recebimentos:</p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-emerald-900">
                <li>Pix: saque disponível em até 2 dias úteis após a confirmação.</li>
                <li>Boleto: saque disponível após 3 dias úteis da compensação.</li>
                <li>Cartão de crédito: saque liberado em até 30 dias.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Configurações gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-600">
              Cancelar pedidos automaticamente após o prazo de pagamento expirado (conforme prazos acima)
            </span>
            <Switch
              checked={autoCancel}
              onCheckedChange={setAutoCancel}
              className="data-[state=checked]:bg-[#004d00]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Salvar</Button>
      </div>
    </div>
  );
};

const OrganizerEventFormularioConfiguracoesPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const eventName = "FABRICIO CHRISTIAN DA SILVA CAVALCANTE";
  const [nameEnabled, setNameEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [cpfEnabled, setCpfEnabled] = useState(true);
  const [birthEnabled, setBirthEnabled] = useState(false);
  const [phoneEnabled, setPhoneEnabled] = useState(true);

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, route: `/organizador/evento/${id}/configuracoes/pagina` },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, active: true },
    { label: "Mensagens", icon: MessageSquare },
  ];

  const fields = [
    {
      label: "Nome completo",
      input: <Input disabled placeholder="Nome completo" className="bg-slate-50" />,
      checked: nameEnabled,
      onCheckedChange: setNameEnabled,
    },
    {
      label: "E-mail",
      input: <Input disabled placeholder="email@exemplo.com" className="bg-slate-50" />,
      checked: emailEnabled,
      onCheckedChange: setEmailEnabled,
    },
    {
      label: "CPF",
      input: (
        <PatternFormat
          format="###.###.###-##"
          mask="_"
          customInput={Input}
          disabled
          placeholder="___.___.___-__"
          className="bg-slate-50"
        />
      ),
      checked: cpfEnabled,
      onCheckedChange: setCpfEnabled,
    },
    {
      label: "Data de nascimento",
      input: (
        <PatternFormat
          format="##/##/####"
          mask="_"
          customInput={Input}
          disabled
          placeholder="__/__/____"
          className="bg-slate-50"
        />
      ),
      checked: birthEnabled,
      onCheckedChange: setBirthEnabled,
    },
    {
      label: "Telefone (Whatsapp)",
      input: (
        <PatternFormat
          format="(##) #####-####"
          mask="_"
          customInput={Input}
          disabled
          placeholder="(__) _____-____"
          className="bg-slate-50"
        />
      ),
      checked: phoneEnabled,
      onCheckedChange: setPhoneEnabled,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <Link
            to="/organizador/meus-eventos"
            className="text-sm text-muted-foreground hover:text-[#004d00]"
          >
            Meus eventos &gt; {eventName}
          </Link>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}
          >
            Voltar para o painel do evento
          </Button>
          <Button
            variant="outline"
            className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}
          >
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active
                ? "bg-emerald-50 text-[#004d00]"
                : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader>
          <div className="w-fit border-b-4 border-[#004d00] pb-1">
            <CardTitle className="text-lg">Formulário de inscrição</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 sm:flex-1">
                <label className="text-sm font-medium text-slate-700">{field.label}</label>
                {field.input}
              </div>
              <Switch
                checked={field.checked}
                onCheckedChange={field.onCheckedChange}
                className="data-[state=checked]:bg-[#004d00]"
              />
            </div>
          ))}

          <Button
            variant="outline"
            className="w-fit border-emerald-100 bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
          >
            + Adicionar campo
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#004d00] text-white hover:bg-[#003a00]">Salvar campos customizados</Button>
      </div>
    </div>
  );
};

const OrganizerEventCheckinsPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-foreground">Check-ins</h1>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/role-select" element={<ProtectedRoute><RoleSelectPage /></ProtectedRoute>} />
            <Route path="/evento/:slug" element={<PublicEventPage />} />

            <Route
              path="/organizador/meus-eventos"
              element={
                <ProtectedRoute>
                  <RoleRoute requiredRole="organizer">
                    <OrganizerEventsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/eventos/categorias"
              element={
                <ProtectedRoute>
                  <RoleRoute requiredRole="organizer">
                    <OrganizerEventsPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/evento/novo"
              element={
                <ProtectedRoute>
                  <RoleRoute requiredRole="organizer">
                    <OrganizerEventNewPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizador/evento/:id/visualizar"
              element={
                <ProtectedRoute>
                  <RoleRoute requiredRole="organizer">
                    <OrganizerEventPreviewPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizador/home"
              element={
                <ProtectedRoute>
                  <RoleRoute requiredRole="organizer">
                    <DashboardPage />
                  </RoleRoute>
                </ProtectedRoute>
              }
            />
            
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Organizer Routes */}
              <Route element={<RoleRoute requiredRole="organizer" />}>
                <Route path="/organizador/evento/:id/dashboard" element={<OrganizerEventDashboardPage />} />
                <Route path="/organizador/evento/:id/ingressos" element={<OrganizerEventIngressosPage />} />
                <Route path="/organizador/evento/:id/participantes" element={<OrganizerEventParticipantesPage />} />
                <Route path="/organizador/evento/:id/fila-de-espera" element={<OrganizerEventFilaDeEsperaPage />} />
                <Route path="/organizador/evento/:id/financeiro" element={<OrganizerEventFinanceiroPage />} />
                <Route path="/organizador/evento/:id/financeiro/cupons" element={<OrganizerEventCuponsPage />} />
                <Route path="/organizador/evento/:id/financeiro/repasse" element={<OrganizerEventRepassePage />} />
                <Route path="/organizador/evento/:id/configuracoes" element={<OrganizerEventConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/pagina" element={<OrganizerEventPaginaConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/pagamento" element={<OrganizerEventPagamentoConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/formulario" element={<OrganizerEventFormularioConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/checkins" element={<OrganizerEventCheckinsPage />} />
                <Route path="/crm" element={<Navigate to="/crm/pessoas" replace />} />
                <Route path="/crm/:section" element={<CRMPage />} />
              </Route>

              {/* Participant Routes */}
              <Route element={<RoleRoute requiredRole="participant" />}>
                <Route path="/participante/meus-ingressos" element={<MyTicketsPage />} />
                <Route path="/participante/explorar" element={<ExploreEventsPage />} />
              </Route>

              {/* Common Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Route>

            <Route path="/organizador/dashboard" element={<Navigate to="/organizador/home" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
