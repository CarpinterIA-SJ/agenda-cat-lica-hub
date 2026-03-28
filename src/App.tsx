import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
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
  MapPin,
  Video,
  Shuffle,
  Locate,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

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
          { icon: Ticket, label: "Ingressos" },
          { icon: CreditCard, label: "Pagamento" },
          { icon: ClipboardList, label: "Formulário de inscrição" },
          { icon: MessageSquare, label: "Mensagens" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 p-4 text-center">
            <item.icon className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-medium text-foreground">{item.label}</span>
          </div>
        ))}
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

const OrganizerEventIngressosPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-foreground">Gerenciar ingressos</h1>
  </div>
);

const OrganizerEventParticipantesPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-foreground">Participantes</h1>
  </div>
);

const OrganizerEventFinanceiroPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
  </div>
);

const OrganizerEventConfiguracoesPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
  </div>
);

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
                <Route path="/organizador/evento/:id/financeiro" element={<OrganizerEventFinanceiroPage />} />
                <Route path="/organizador/evento/:id/configuracoes" element={<OrganizerEventConfiguracoesPage />} />
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
