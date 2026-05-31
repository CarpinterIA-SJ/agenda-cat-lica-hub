import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useNavigate, useParams, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, useState } from "react";
import LoginPage from "./pages/LoginPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import MyTicketDetailPage from "./pages/MyTicketDetailPage";
import ExploreEventsPage, { PublicEventPage } from "./pages/ExploreEventsPage";
import SupportPage from "./pages/SupportPage";
import OrganizerEventsPage from "./pages/OrganizerEventsPage";
import OrganizerEventMensagensPage, { MessageSection } from "./pages/OrganizerEventMensagensPage";
import CRMPage from "./pages/CRMPage";
import NotFound from "./pages/NotFound";
import CheckinsPage from "./pages/CheckinsPage";
import CheckinsTiposPage from "./pages/CheckinsTiposPage";
import CheckinsRealizadosPage from "./pages/CheckinsRealizadosPage";
import FinanceiroRepassePage from "./pages/FinanceiroRepassePage";
import OrganizadoresPage from "./pages/OrganizadoresPage";
import MinhaContaPage from "./pages/MinhaContaPage";
import PlansPage from "./pages/PlansPage";
import LandingPage from "./pages/LandingPage";
import OrganizerEventDashboardPage from "./pages/OrganizerEventDashboardPage";
import AdminLayout from "./components/AdminLayout";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminFinancialPage from "./pages/admin/AdminFinancialPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminOrganizersPage from "./pages/admin/AdminOrganizersPage";
import AdminPayoutsPage from "./pages/admin/AdminPayoutsPage";
import AdminModerationPage from "./pages/admin/AdminModerationPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ThemeToggle } from "./components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TiptapLink from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useMyOrganization } from "@/hooks/use-organizations";
import { useEvent, useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { useTickets, useCreateTicket, useDeleteTicket } from "@/hooks/use-tickets";
import { useRegistrations } from "@/hooks/use-registrations";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "@/hooks/use-coupons";

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children ? <>{children}</> : <Outlet />;
};

const RoleRoute = ({ children, requiredRole }: { children?: React.ReactNode; requiredRole?: 'organizer' | 'participant' | 'admin' }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!role) return <Navigate to="/role-select" replace />;
  if (requiredRole && role !== requiredRole) {
    const fallback =
      role === 'admin'
        ? "/admin"
        : role === 'organizer'
          ? "/organizador/home"
          : "/participante/meus-ingressos";
    return <Navigate to={fallback} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (role !== 'admin') {
    return <Navigate to="/organizador/home" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
};

/**
 * Gatekeeper para rotas do SuperAdmin. Lê a role 'superadmin'/'admin' da
 * tabela user_roles via AuthProvider (server-side). NÃO usa o legado
 * `role` do localStorage para decidir — esse gate é independente.
 *
 * Sem sessão: redireciona para /login.
 * Com sessão mas sem role de plataforma: 403 inline (não redireciona para
 * /organizador/home, pra evitar interferir com fluxos legados de role).
 */
const SuperAdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { session, loading, rolesLoading, isPlatformAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading || rolesLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  if (!session) return <Navigate to="/login" replace />;

  if (!isPlatformAdmin) {
    const handleBackToLogin = async () => {
      await signOut();
      navigate("/login", { replace: true });
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">403 — Acesso restrito</h1>
        <p className="text-sm text-slate-600 max-w-md">
          Esta área é exclusiva para administradores da plataforma. Sua conta
          não possui a role <code>superadmin</code> ou <code>admin</code>.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Button
            onClick={handleBackToLogin}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Voltar para o login
          </Button>
          <Link to="/" className="text-sm text-emerald-700 underline">
            Ir para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

const TAB_ORDER = ["informacoes", "pagina", "ingressos", "pagamento", "formulario", "mensagens"];

const OrganizerEventNewPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: org } = useMyOrganization();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const createTicket = useCreateTicket();
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("informacoes");
  const [maxTabIndex, setMaxTabIndex] = useState(0);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [tipoEvento, setTipoEvento] = useState("presencial");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Ingressos state
  interface Ingresso { id: string; nome: string; quantidade: number; preco: number | null; tipo: "pago" | "gratuito"; status: string; visibilidade: string; repassarTaxas: boolean; }
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [ingressoSearch, setIngressoSearch] = useState("");
  const [dialogTipoIngresso, setDialogTipoIngresso] = useState<"pago" | "gratuito" | null>(null);
  const [ingressoNome, setIngressoNome] = useState("");
  const [ingressoQtd, setIngressoQtd] = useState("");
  const [ingressoPreco, setIngressoPreco] = useState("");

  const handleSalvarIngresso = () => {
    if (!ingressoNome.trim() || !ingressoQtd) return;
    const novo: Ingresso = {
      id: Date.now().toString(),
      nome: ingressoNome,
      quantidade: parseInt(ingressoQtd, 10),
      preco: dialogTipoIngresso === "pago" ? parseFloat(ingressoPreco.replace(",", ".")) : null,
      tipo: dialogTipoIngresso!,
      status: "Ativo",
      visibilidade: "Público",
      repassarTaxas: false,
    };
    setIngressos((prev) => [...prev, novo]);
    setDialogTipoIngresso(null);
    setIngressoNome("");
    setIngressoQtd("");
    setIngressoPreco("");
  };

  // Pagamento state
  const [pgCreditEnabled, setPgCreditEnabled] = useState(true);
  const [pgPixEnabled, setPgPixEnabled] = useState(false);
  const [pgPixPrazo, setPgPixPrazo] = useState("30");
  const [pgPixUnit, setPgPixUnit] = useState("minutos");
  const [pgBoletoEnabled, setPgBoletoEnabled] = useState(false);
  const [pgBoletoPrazo, setPgBoletoPrazo] = useState("2");
  const [pgAutoCancel, setPgAutoCancel] = useState(true);

  // Formulário de inscrição state
  const [frmNameEnabled, setFrmNameEnabled] = useState(true);
  const [frmEmailEnabled, setFrmEmailEnabled] = useState(true);
  const [frmCpfEnabled, setFrmCpfEnabled] = useState(true);
  const [frmBirthEnabled, setFrmBirthEnabled] = useState(false);
  const [frmPhoneEnabled, setFrmPhoneEnabled] = useState(true);
  const [frmCustomFields, setFrmCustomFields] = useState<{ id: string; label: string; enabled: boolean }[]>([]);
  const [frmAddFieldOpen, setFrmAddFieldOpen] = useState(false);
  const [frmNewFieldLabel, setFrmNewFieldLabel] = useState("");

  // Form fields
  const [nomeEvento, setNomeEvento] = useState("");
  const [organizadorId, setOrganizadorId] = useState("");
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [categoria, setCategoria] = useState("");

  const [organizadores, setOrganizadoresState] = useState<{ id: string; nome: string }[]>(() => {
    try {
      const stored = localStorage.getItem("organizadores");
      return stored ? JSON.parse(stored) : [{ id: "1", nome: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE" }];
    } catch {
      return [{ id: "1", nome: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE" }];
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("organizadores");
        if (stored) setOrganizadoresState(JSON.parse(stored));
      } catch {
        // keep current
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Banner
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBannerUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Descrição (Tiptap)
  const descEditor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TiptapLink.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Descreva o evento para os participantes..." }),
    ],
    content: "",
  });

  const toolbarBtn = (active?: boolean) =>
    `flex items-center justify-center rounded-md border px-2 py-1 text-xs font-medium transition ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 text-slate-500 hover:text-emerald-700"
    }`;

  // Location fields
  const [enderecoSearch, setEnderecoSearch] = useState("");
  const [enderecoSuggestions, setEnderecoSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [nomeLocal, setNomeLocal] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapAddress, setMapAddress] = useState<string | null>(null);

  useEffect(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepError(null);
      return;
    }
    let cancelled = false;
    setCepLoading(true);
    setCepError(null);
    (async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (cancelled) return;
        if (data?.erro) {
          setCepError("CEP não encontrado.");
          return;
        }
        const ruaCep = data.logradouro || "";
        const bairroCep = data.bairro || "";
        const cidadeCep = data.localidade || "";
        const ufCep = (data.uf || "").toUpperCase();
        setRua(ruaCep);
        setBairro(bairroCep);
        setCidade(cidadeCep);
        setEstado(ufCep);
        const full = [ruaCep, bairroCep, cidadeCep, ufCep].filter(Boolean).join(", ");
        if (full) {
          setEnderecoSearch(full);
          setMapAddress(full);
        }
      } catch {
        if (!cancelled) setCepError("Falha ao consultar CEP.");
      } finally {
        if (!cancelled) setCepLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cep]);

  useEffect(() => {
    if (enderecoSearch.length < 3) {
      setEnderecoSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(enderecoSearch)}&format=json&addressdetails=1&limit=5`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const data = await res.json();
        setEnderecoSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        // ignore
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [enderecoSearch]);

  const handleSelectSuggestion = (item: any) => {
    const addr = item.address || {};
    setEnderecoSearch(item.display_name);
    setShowSuggestions(false);
    setNomeLocal(addr.amenity || addr.building || addr.shop || addr.leisure || "");
    setRua(addr.road || addr.street || addr.pedestrian || "");
    setNumero(addr.house_number || "S/N");
    setBairro(addr.suburb || addr.neighbourhood || addr.quarter || addr.district || "");
    setCidade(addr.city || addr.town || addr.village || addr.municipality || "");
    const stateCode = addr.ISO3166_2_lvl4 ? addr.ISO3166_2_lvl4.split("-")[1] : (addr.state_code || "");
    setEstado(stateCode);
    setMapCoords({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
    setMapAddress(item.display_name);
  };

  const mapSrc = mapAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=m&z=17&ie=UTF8&iwloc=&output=embed&hl=pt-BR`
    : null;

  const canAdvance = nomeEvento.trim() !== "" && organizadorId !== "" && termosAceitos;

  const advanceTab = () => {
    const currentIndex = TAB_ORDER.indexOf(tab);
    const nextTab = TAB_ORDER[currentIndex + 1];
    if (nextTab) {
      const nextIndex = currentIndex + 1;
      setMaxTabIndex((prev) => Math.max(prev, nextIndex));
      setTab(nextTab);
    }
  };

  const buildLocation = () => {
    if (tipoEvento === "online") return null;
    return {
      name: nomeLocal || null,
      street: rua || null,
      number: numero || null,
      neighborhood: bairro || null,
      complement: complemento || null,
      city: cidade || null,
      state: estado || null,
      cep: cep || null,
      lat: mapCoords?.lat ?? null,
      lon: mapCoords?.lon ?? null,
    };
  };

  const handleCriarEvento = async () => {
    if (!canAdvance) {
      const missing: string[] = [];
      if (nomeEvento.trim() === "") missing.push("nome do evento");
      if (organizadorId === "") missing.push("organizador");
      if (!termosAceitos) missing.push("aceite dos termos de uso");
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missing.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    if (!org?.id) {
      toast({ title: "Organização não encontrada", description: "Aguarde a criação da sua organização e tente novamente.", variant: "destructive" });
      return;
    }

    // Persist event on first advance (informações tab)
    setSaving(true);
    try {
      const descriptionHtml = descEditor?.getHTML?.() || "";
      const descriptionText = (descEditor?.getText?.() || "").trim();

      if (!eventoId) {
        const created = await createEvent.mutateAsync({
          organization_id: org.id,
          created_by: org.owner_id,
          name: nomeEvento.trim(),
          description: descriptionText ? descriptionHtml : null,
          description_text: descriptionText || null,
          banner_url: bannerUrl || null,
          category: categoria || null,
          format: tipoEvento as any,
          visibility: "public",
          status: "active",
          start_at: dataInicio ? new Date(`${dataInicio}T00:00:00`).toISOString() : null,
          end_at: dataFim ? new Date(`${dataFim}T00:00:00`).toISOString() : null,
          location: buildLocation() as any,
        });
        setEventoId(created.id);
      } else {
        await updateEvent.mutateAsync({
          id: eventoId,
          name: nomeEvento.trim(),
          description: descriptionText ? descriptionHtml : null,
          description_text: descriptionText || null,
          banner_url: bannerUrl || null,
          category: categoria || null,
          format: tipoEvento as any,
          start_at: dataInicio ? new Date(`${dataInicio}T00:00:00`).toISOString() : null,
          end_at: dataFim ? new Date(`${dataFim}T00:00:00`).toISOString() : null,
          location: buildLocation() as any,
        });
      }
      toast({ title: "Evento criado!", description: "Agora configure os demais detalhes." });
      advanceTab();
    } catch (e: any) {
      toast({ title: "Erro ao salvar evento", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Persist tickets to Supabase when advancing from ingressos tab
  const handleSalvarIngressos = async () => {
    if (!eventoId) { advanceTab(); return; }
    setSaving(true);
    try {
      for (const i of ingressos) {
        await createTicket.mutateAsync({
          event_id: eventoId,
          name: i.nome,
          type: i.tipo,
          quantity: i.quantidade,
          price_brl: i.preco ?? 0,
          visibility: i.visibilidade === "Público" ? "public" : "private",
          status: i.status === "Ativo" ? "active" : "inactive",
          pass_fees: i.repassarTaxas,
        });
      }
      advanceTab();
    } catch (e: any) {
      toast({ title: "Erro ao salvar ingressos", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Persist form config (show_fields + custom_fields) when advancing from formulário tab
  const handleSalvarFormulario = async () => {
    if (!eventoId) { advanceTab(); return; }
    setSaving(true);
    try {
      await updateEvent.mutateAsync({
        id: eventoId,
        show_fields: {
          nome: frmNameEnabled,
          email: frmEmailEnabled,
          cpf: frmCpfEnabled,
          nascimento: frmBirthEnabled,
          whatsapp: frmPhoneEnabled,
        } as any,
        custom_fields: frmCustomFields
          .filter((f) => f.enabled)
          .map((f) => ({ id: f.id, label: f.label, type: "text", required: true })) as any,
      });
      advanceTab();
    } catch (e: any) {
      toast({ title: "Erro ao salvar formulário", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Meus eventos &gt; Criar evento</p>
          <h1 className="text-2xl font-semibold text-foreground">Criar evento</h1>
        </div>
        <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100 w-fit" onClick={() => navigate("/organizador/meus-eventos")}>
          Voltar para os eventos
        </Button>
      </div>

      <div className="space-y-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-white border rounded-lg">
            <TabsTrigger value="informacoes" className="gap-2 data-[state=active]:text-emerald-800">
              <Info className="h-4 w-4" />
              Informações gerais
            </TabsTrigger>
            <TabsTrigger value="pagina" className="gap-2" disabled={!canAdvance && tab !== "pagina"}>
              <Globe className="h-4 w-4" />
              Página do evento
            </TabsTrigger>
            <TabsTrigger value="ingressos" className="gap-2" disabled={maxTabIndex < TAB_ORDER.indexOf("ingressos")}>
              <Ticket className="h-4 w-4" />
              Ingressos
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="gap-2" disabled={maxTabIndex < TAB_ORDER.indexOf("pagamento")}>
              <CreditCard className="h-4 w-4" />
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="formulario" className="gap-2" disabled={maxTabIndex < TAB_ORDER.indexOf("formulario")}>
              <ClipboardList className="h-4 w-4" />
              Formulário de inscrição
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2" disabled={maxTabIndex < TAB_ORDER.indexOf("mensagens")}>
              <MessageSquare className="h-4 w-4" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          {/* ── Aba 1: Informações gerais ── */}
          <TabsContent value="informacoes" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Tipo de evento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={tipoEvento} onValueChange={setTipoEvento} className="grid gap-3 md:grid-cols-3">
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
                  <Select value={organizadorId} onValueChange={setOrganizadorId}>
                    <SelectTrigger className="md:max-w-sm">
                      <SelectValue placeholder="Selecione o organizador" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizadores.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => navigate("/organizadores")}>
                    + Adicionar organizador
                  </Button>
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
                  <label className="text-sm font-medium">
                    Nome do evento <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Informe o nome do evento"
                    value={nomeEvento}
                    onChange={(e) => setNomeEvento(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria do evento</label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acampamentos">Acampamentos</SelectItem>
                        <SelectItem value="catequese">Catequese</SelectItem>
                        <SelectItem value="congressos">Congressos e Seminários</SelectItem>
                        <SelectItem value="cursos">Cursos e Workshops</SelectItem>
                        <SelectItem value="encontros">Encontros de Formação</SelectItem>
                        <SelectItem value="diversos">Eventos Diversos</SelectItem>
                        <SelectItem value="palestras">Palestras</SelectItem>
                        <SelectItem value="retiros">Retiros</SelectItem>
                        <SelectItem value="seminario-espirito">Seminário de Vida no Espírito Santo</SelectItem>
                        <SelectItem value="shows">Shows Católicos</SelectItem>
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
                      <PatternFormat format="##/##/####" mask="_" placeholder="dd/mm/aaaa" inputMode="numeric" customInput={Input} value={dataInicio} onValueChange={(v) => setDataInicio(v.formattedValue)} />
                      <PatternFormat format="##:##" mask="_" placeholder="hh:mm" inputMode="numeric" customInput={Input} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Término do evento</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <PatternFormat format="##/##/####" mask="_" placeholder="dd/mm/aaaa" inputMode="numeric" customInput={Input} value={dataFim} onValueChange={(v) => setDataFim(v.formattedValue)} />
                      <PatternFormat format="##:##" mask="_" placeholder="hh:mm" inputMode="numeric" customInput={Input} />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: search + fields */}
                  <div className="space-y-4">
                    {/* Address search */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        <span className="text-destructive">*</span> Endereço do evento:
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Digite uma consulta"
                          value={enderecoSearch}
                          onChange={(e) => {
                            setEnderecoSearch(e.target.value);
                            if (e.target.value.length < 3) setShowSuggestions(false);
                          }}
                          onFocus={() => enderecoSuggestions.length > 0 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          autoComplete="off"
                        />
                        {showSuggestions && enderecoSuggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                            {enderecoSuggestions.map((item: any) => (
                              <button
                                key={item.place_id}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                                onMouseDown={() => handleSelectSuggestion(item)}
                              >
                                {item.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail fields */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Detalhes do endereço</p>
                        <p className="text-xs text-primary">Confira o endereço abaixo e a localização do mapa</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          <span className="text-destructive">*</span> CEP:
                        </label>
                        <PatternFormat
                          format="#####-###"
                          mask="_"
                          placeholder="00000-000"
                          inputMode="numeric"
                          customInput={Input}
                          value={cep}
                          onValueChange={(v) => setCep(v.value)}
                        />
                        {cepLoading && (
                          <p className="text-xs text-slate-500">Buscando endereço...</p>
                        )}
                        {cepError && (
                          <p className="text-xs text-destructive">{cepError}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          <span className="text-destructive">*</span> Nome do local:
                        </label>
                        <Input
                          value={nomeLocal}
                          onChange={(e) => setNomeLocal(e.target.value.toUpperCase())}
                          placeholder="Nome do local"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            <span className="text-destructive">*</span> Rua:
                          </label>
                          <Input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            <span className="text-destructive">*</span> Número:
                          </label>
                          <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="S/N" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            <span className="text-destructive">*</span> Bairro:
                          </label>
                          <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Complemento:</label>
                          <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            <span className="text-destructive">*</span> Cidade:
                          </label>
                          <Input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Estado:</label>
                          <Input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="UF" maxLength={2} className="uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: map */}
                  <div className="flex flex-col rounded-lg overflow-hidden border border-slate-200 min-h-[320px]">
                    {mapSrc ? (
                      <iframe
                        src={mapSrc}
                        title="Mapa do local"
                        className="w-full flex-1"
                        style={{ minHeight: "320px", border: 0 }}
                        loading="lazy"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400">
                        <Locate className="h-8 w-8" />
                        <span className="text-sm">Digite o endereço para ver o mapa</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termos de uso</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-3 text-sm text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={termosAceitos}
                    onCheckedChange={(checked) => setTermosAceitos(checked === true)}
                  />
                  Concordo com os termos de uso e políticas de privacidade da plataforma
                </label>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!canAdvance}
                onClick={handleCriarEvento}
              >
                Criar evento e continuar
              </Button>
            </div>
          </TabsContent>

          {/* ── Aba 2: Página do evento ── */}
          <TabsContent value="pagina" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Banner do evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className="relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:border-emerald-500 transition-colors overflow-hidden"
                  style={{ minHeight: "160px" }}
                  onClick={() => bannerInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setBannerUrl(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  {bannerUrl ? (
                    <>
                      <img src={bannerUrl} alt="Banner" className="w-full h-48 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBannerUrl(null); }}
                        className="absolute top-2 right-2 rounded-full bg-white/80 px-2 py-1 text-xs text-slate-600 hover:bg-white shadow"
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-10">
                      <Upload className="h-8 w-8 text-slate-400" />
                      <p className="text-sm font-medium text-slate-600">Clique ou arraste para enviar o banner</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP — recomendado 1920×600 px</p>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Descrição do evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Descreva o evento para os participantes. Você pode formatar o texto, adicionar links e imagens.
                </p>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleHeading({ level: 1 }).run()} className={toolbarBtn(descEditor?.isActive("heading", { level: 1 }))}><Heading1 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarBtn(descEditor?.isActive("heading", { level: 2 }))}><Heading2 className="h-4 w-4" /></button>
                  <span className="mx-1 w-px self-stretch bg-slate-200" />
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleBold().run()} className={toolbarBtn(descEditor?.isActive("bold"))}><Bold className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleItalic().run()} className={toolbarBtn(descEditor?.isActive("italic"))}><Italic className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleUnderline().run()} className={toolbarBtn(descEditor?.isActive("underline"))}><Underline className="h-4 w-4" /></button>
                  <span className="mx-1 w-px self-stretch bg-slate-200" />
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleBulletList().run()} className={toolbarBtn(descEditor?.isActive("bulletList"))}><List className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().toggleOrderedList().run()} className={toolbarBtn(descEditor?.isActive("orderedList"))}><ListOrdered className="h-4 w-4" /></button>
                  <span className="mx-1 w-px self-stretch bg-slate-200" />
                  <button type="button" onClick={() => descEditor?.chain().focus().setTextAlign("left").run()} className={toolbarBtn(descEditor?.isActive({ textAlign: "left" }))}><AlignLeft className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().setTextAlign("center").run()} className={toolbarBtn(descEditor?.isActive({ textAlign: "center" }))}><AlignCenter className="h-4 w-4" /></button>
                  <button type="button" onClick={() => descEditor?.chain().focus().setTextAlign("right").run()} className={toolbarBtn(descEditor?.isActive({ textAlign: "right" }))}><AlignRight className="h-4 w-4" /></button>
                </div>
                {/* Editor */}
                <div
                  className="min-h-[220px] rounded-lg border border-slate-200 bg-white p-4 cursor-text"
                  onClick={() => descEditor?.commands.focus()}
                >
                  <EditorContent editor={descEditor} className="prose max-w-none text-sm focus:outline-none" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Políticas do evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span>Permite solicitar cancelamento de pedido em até</span>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={7}
                    className="w-16 text-center px-2"
                  />
                  <span>dias após a compra e no mínimo</span>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={24}
                    className="w-16 text-center px-2"
                  />
                  <span>horas antes do início do evento.</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span>Permite edição de participantes no mínimo</span>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={24}
                    className="w-16 text-center px-2"
                  />
                  <span>horas antes do início do evento.</span>
                </div>

                <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div className="space-y-2">
                    <p className="font-semibold">Atenção!</p>
                    <p>
                      De acordo com o Código de Direito do Consumidor (CDC), Art. 49, em qualquer compra online, há o direito de cancelamento e reembolso em até 7 dias após o pagamento. Você pode definir um período maior, caso queira.
                    </p>
                    <p>
                      Solicitações de cancelamento e reembolso que sejam realizadas diretamente na plataforma dentro desse período de 7 dias, serão atendidas automaticamente. O valor a ser "reembolsado" será o valor total pago, descontando as taxas de serviço da plataforma.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" className="h-12 px-6" onClick={() => setTab("informacoes")}>
                Voltar
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() => {
                  const nextIndex = TAB_ORDER.indexOf("ingressos");
                  setMaxTabIndex((prev) => Math.max(prev, nextIndex));
                  setTab("ingressos");
                }}
              >
                Salvar e continuar
              </Button>
            </div>
          </TabsContent>

          {/* ── Aba 3: Ingressos ── */}
          <TabsContent value="ingressos" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="w-fit border-b-4 border-emerald-700 pb-1">
                    <CardTitle className="text-lg">Ingressos</CardTitle>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="bg-emerald-700 text-white hover:bg-emerald-800"
                    onClick={() => { setIngressoNome(""); setIngressoQtd(""); setIngressoPreco(""); setDialogTipoIngresso("pago"); }}
                  >
                    + Ingresso pago
                  </Button>
                  <Button
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => { setIngressoNome(""); setIngressoQtd(""); setIngressoPreco(""); setDialogTipoIngresso("gratuito"); }}
                  >
                    + Ingresso gratuito
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar..."
                    value={ingressoSearch}
                    onChange={(e) => setIngressoSearch(e.target.value)}
                  />
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
                      {ingressos.filter((i) => i.nome.toLowerCase().includes(ingressoSearch.toLowerCase())).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                            Nenhum ingresso adicionado.
                          </td>
                        </tr>
                      ) : (
                        ingressos
                          .filter((i) => i.nome.toLowerCase().includes(ingressoSearch.toLowerCase()))
                          .map((i) => (
                            <tr key={i.id} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-medium text-slate-800">{i.nome}</td>
                              <td className="px-4 py-3 text-slate-600">{i.quantidade}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {i.tipo === "gratuito" ? "Gratuito" : `R$ ${i.preco?.toFixed(2).replace(".", ",")}`}
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{i.status}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">{i.visibilidade}</td>
                              <td className="px-4 py-3 text-slate-600">{i.repassarTaxas ? "Sim" : "Não"}</td>
                              <td className="px-4 py-3">
                                <button
                                  className="text-destructive hover:text-destructive/80 text-xs"
                                  onClick={() => setIngressos((prev) => prev.filter((x) => x.id !== i.id))}
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
                  <span className="text-xs text-slate-500">
                    {ingressos.length} ingresso{ingressos.length !== 1 ? "s" : ""} cadastrado{ingressos.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" className="h-12 px-6" onClick={() => setTab("pagina")}>
                Voltar
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={saving}
                onClick={handleSalvarIngressos}
              >
                Salvar e continuar
              </Button>
            </div>
          </TabsContent>

          {/* ── Aba 4: Pagamento ── */}
          <TabsContent value="pagamento" className="space-y-6 mt-0">
            <Card className="rounded-2xl bg-white shadow-sm">
              <CardHeader>
                <div className="w-fit border-b-4 border-emerald-700 pb-1">
                  <CardTitle>Formas de pagamento disponíveis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Cartão de crédito</span>
                  <Switch
                    checked={pgCreditEnabled}
                    onCheckedChange={setPgCreditEnabled}
                    className="data-[state=checked]:bg-emerald-700"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Pix</span>
                    <Switch
                      checked={pgPixEnabled}
                      onCheckedChange={setPgPixEnabled}
                      className="data-[state=checked]:bg-emerald-700"
                    />
                  </div>
                  {pgPixEnabled && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Prazo para pagamento</label>
                        <Input
                          type="number"
                          value={pgPixPrazo}
                          onChange={(e) => setPgPixPrazo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500">Unidade</label>
                        <Select value={pgPixUnit} onValueChange={setPgPixUnit}>
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
                      checked={pgBoletoEnabled}
                      onCheckedChange={setPgBoletoEnabled}
                      className="data-[state=checked]:bg-emerald-700"
                    />
                  </div>
                  {pgBoletoEnabled && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500">Prazo para pagamento</label>
                      <div className="relative max-w-xs">
                        <Input
                          type="number"
                          value={pgBoletoPrazo}
                          onChange={(e) => setPgBoletoPrazo(e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">dias</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
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
                    checked={pgAutoCancel}
                    onCheckedChange={setPgAutoCancel}
                    className="data-[state=checked]:bg-emerald-700"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" className="h-12 px-6" onClick={() => setTab("ingressos")}>
                Voltar
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() => {
                  const nextIndex = TAB_ORDER.indexOf("formulario");
                  setMaxTabIndex((prev) => Math.max(prev, nextIndex));
                  setTab("formulario");
                }}
              >
                Salvar e continuar
              </Button>
            </div>
          </TabsContent>

          {/* ── Aba 5: Formulário de inscrição ── */}
          <TabsContent value="formulario" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="w-fit border-b-4 border-emerald-700 pb-1">
                  <CardTitle>Formulário de inscrição</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Nome completo",
                    input: <Input disabled placeholder="Nome completo" className="bg-slate-50" />,
                    checked: frmNameEnabled,
                    onCheckedChange: setFrmNameEnabled,
                  },
                  {
                    label: "E-mail",
                    input: <Input disabled placeholder="email@exemplo.com" className="bg-slate-50" />,
                    checked: frmEmailEnabled,
                    onCheckedChange: setFrmEmailEnabled,
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
                    checked: frmCpfEnabled,
                    onCheckedChange: setFrmCpfEnabled,
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
                    checked: frmBirthEnabled,
                    onCheckedChange: setFrmBirthEnabled,
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
                    checked: frmPhoneEnabled,
                    onCheckedChange: setFrmPhoneEnabled,
                  },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2 sm:flex-1">
                      <label className="text-sm font-medium text-slate-700">{field.label}</label>
                      {field.input}
                    </div>
                    <Switch
                      checked={field.checked}
                      onCheckedChange={field.onCheckedChange}
                      className="data-[state=checked]:bg-emerald-700"
                    />
                  </div>
                ))}

                {frmCustomFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2 sm:flex-1">
                      <label className="text-sm font-medium text-slate-700">{cf.label}</label>
                      <Input disabled placeholder={cf.label} className="bg-slate-50" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={cf.enabled}
                        onCheckedChange={(val) =>
                          setFrmCustomFields((prev) =>
                            prev.map((f) => (f.id === cf.id ? { ...f, enabled: val } : f))
                          )
                        }
                        className="data-[state=checked]:bg-emerald-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFrmCustomFields((prev) => prev.filter((f) => f.id !== cf.id))}
                        className="text-slate-400 hover:text-red-500 transition text-lg leading-none"
                        title="Remover campo"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-fit border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  onClick={() => { setFrmNewFieldLabel(""); setFrmAddFieldOpen(true); }}
                >
                  + Adicionar campo
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" className="h-12 px-6" onClick={() => setTab("pagamento")}>
                Voltar
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800"
                disabled={saving}
                onClick={handleSalvarFormulario}
              >
                Salvar e continuar
              </Button>
            </div>
          </TabsContent>

          {/* Dialog: adicionar campo customizado */}
          <Dialog open={frmAddFieldOpen} onOpenChange={setFrmAddFieldOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Adicionar campo</DialogTitle>
                <DialogDescription>Informe o nome do campo que deseja adicionar ao formulário.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do campo</label>
                <Input
                  placeholder="Ex: RG, Diocese, Paróquia..."
                  value={frmNewFieldLabel}
                  onChange={(e) => setFrmNewFieldLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && frmNewFieldLabel.trim()) {
                      setFrmCustomFields((prev) => [
                        ...prev,
                        { id: Date.now().toString(), label: frmNewFieldLabel.trim(), enabled: true },
                      ]);
                      setFrmAddFieldOpen(false);
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFrmAddFieldOpen(false)}>Cancelar</Button>
                <Button
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  disabled={!frmNewFieldLabel.trim()}
                  onClick={() => {
                    setFrmCustomFields((prev) => [
                      ...prev,
                      { id: Date.now().toString(), label: frmNewFieldLabel.trim(), enabled: true },
                    ]);
                    setFrmAddFieldOpen(false);
                  }}
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Aba 6: Mensagens ── */}
          <TabsContent value="mensagens" className="space-y-6 mt-0">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <span>
                A API do WhatsApp pode apresentar instabilidades. Em caso de falha no envio pelo WhatsApp, as mensagens padrão serão enviadas automaticamente por e-mail para garantir a entrega.
              </span>
            </div>

            <MessageSection
              title="Mensagem para confirmação de inscrição - WhatsApp"
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>! Sua inscrição no evento <span class="template-var">{{nome_evento}}</span> foi realizada com sucesso.</p><p>Guarde este comprovante. Em caso de dúvidas, entre em contato conosco.</p><p>Equipe Guardião Eventos</p>`}
            />
            <MessageSection
              title="Mensagem enviada após cadastro em fila de espera - WhatsApp"
              infoBanner="Esta mensagem será enviada automaticamente quando um participante for adicionado à fila de espera via WhatsApp."
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>! Você foi cadastrado(a) na fila de espera do evento <span class="template-var">{{nome_evento}}</span>.</p><p>Assim que uma vaga for liberada, entraremos em contato.</p><p>Equipe Guardião Eventos</p>`}
            />
            <MessageSection
              title="Mensagem para confirmação de inscrição - E-mail"
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Sua inscrição no evento <span class="template-var">{{nome_evento}}</span> foi confirmada com sucesso!</p><p>Você receberá mais detalhes em breve.</p><p>Atenciosamente,<br/>Equipe Guardião Eventos</p>`}
            />
            <MessageSection
              title="Mensagem enviada após cadastro em fila de espera - E-mail"
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Você foi adicionado(a) à fila de espera do evento <span class="template-var">{{nome_evento}}</span>.</p><p>Notificaremos assim que houver disponibilidade.</p><p>Equipe Guardião Eventos</p>`}
            />
            <MessageSection
              title="Mensagem para o ingresso (Comprovante de inscrição em PDF)"
              defaultContent={`<p>Segue em anexo o comprovante de inscrição do participante <span class="template-var">{{nome}}</span> para o evento <span class="template-var">{{nome_evento}}</span>.</p>`}
            />
            <MessageSection
              title="Mensagem para recuperação de pedido pendente - PIX (não pago)"
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Notamos que seu pagamento via PIX para o evento <span class="template-var">{{nome_evento}}</span> ainda não foi confirmado.</p><p>Complete o pagamento para garantir sua vaga.</p><p>Equipe Guardião Eventos</p>`}
            />
            <MessageSection
              title="Mensagem para recuperação de pedido pendente - Boleto (não pago)"
              defaultContent={`<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Seu boleto para o evento <span class="template-var">{{nome_evento}}</span> está pendente de pagamento.</p><p>Efetue o pagamento até a data de vencimento para garantir sua inscrição.</p><p>Equipe Guardião Eventos</p>`}
            />

            <div className="flex items-center justify-between pb-6">
              <Button variant="outline" className="h-12 px-6" onClick={() => setTab("formulario")}>
                Voltar
              </Button>
              <Button
                className="h-12 px-6 bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={() => {
                  toast({ title: "Mensagens salvas!", description: "Evento criado com sucesso." });
                  if (eventoId) {
                    navigate(`/organizador/evento/${eventoId}/dashboard`);
                  } else {
                    navigate("/organizador/meus-eventos");
                  }
                }}
              >
                Salvar mensagens
              </Button>
            </div>
          </TabsContent>

          {/* Dialog: adicionar ingresso */}
          <Dialog open={!!dialogTipoIngresso} onOpenChange={(open) => !open && setDialogTipoIngresso(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Adicionar ingresso {dialogTipoIngresso === "pago" ? "pago" : "gratuito"}
                </DialogTitle>
                <DialogDescription>Preencha os dados do novo ingresso.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nome</label>
                  <Input placeholder="Nome do ingresso" value={ingressoNome} onChange={(e) => setIngressoNome(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input placeholder="0" type="number" min={1} value={ingressoQtd} onChange={(e) => setIngressoQtd(e.target.value)} />
                </div>
                {dialogTipoIngresso === "pago" && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Preço (R$)</label>
                    <Input placeholder="0,00" value={ingressoPreco} onChange={(e) => setIngressoPreco(e.target.value)} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogTipoIngresso(null)}>Cancelar</Button>
                <Button
                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                  disabled={!ingressoNome.trim() || !ingressoQtd}
                  onClick={handleSalvarIngresso}
                >
                  Salvar ingresso
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>
    </div>
  );
};

// OrganizerEventDashboardPage moved to src/pages/OrganizerEventDashboardPage.tsx

const OrganizerEventPreviewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: event } = useEvent(id);
  const { data: org } = useMyOrganization();

  const formatMap: Record<string, string> = { online: "Online", hibrido: "Híbrido", presencial: "Presencial" };
  const locObj: any = event?.location;
  const title = event?.name ?? "Evento não encontrado";
  const date = event?.start_at
    ? new Date(event.start_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "Data não informada";
  const format = event ? (formatMap[event.format] ?? "") : "";
  const location = locObj ? (typeof locObj === "string" ? locObj : (locObj.name || locObj.city || "")) : "";
  const organizador = org?.name ?? "";

  const initials = organizador
    ? organizador.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "—";

  const formatIcon = format === "Online"
    ? <Video className="w-4 h-4 text-primary" />
    : format === "Híbrido"
    ? <Video className="w-4 h-4 text-primary" />
    : <MapPin className="w-4 h-4 text-primary" />;

  const formatLabel = format === "Online"
    ? "Evento online"
    : format === "Híbrido"
    ? "Evento híbrido"
    : location || "Evento presencial";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Visualização do evento</h1>
        <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => navigate("/organizador/meus-eventos")}>
          Voltar para meus eventos
        </Button>
      </div>

      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {date}
                </span>
                <span className="flex items-center gap-2">
                  {formatIcon}
                  {formatLabel}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900">Políticas do evento</h2>
              <p className="text-sm text-slate-500">
                O cancelamento para pedidos que contém inscrições pagas serão aceitos até 7 dias após a data da compra,
                considerando que a solicitação seja submetida em até 24 horas antes do início do evento.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Inscrição</h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                Nenhum ingresso cadastrado entre em contato com um organizador.
              </div>
            </div>

            {organizador && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Realização</h3>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-400 text-white flex items-center justify-center font-semibold">{initials}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{organizador}</p>
                  </div>
                </div>
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
};

const OrganizerEventIngressosPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [dialogType, setDialogType] = useState<"pago" | "gratuito" | null>(null);
  const [ticketNome, setTicketNome] = useState("");
  const [ticketQtd, setTicketQtd] = useState("");
  const [ticketPreco, setTicketPreco] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");

  const { data: event } = useEvent(id);
  const { data: tickets = [] } = useTickets(id);
  const createTicket = useCreateTicket();
  const deleteTicket = useDeleteTicket();
  const eventName = event?.name ?? id ?? "";

  const handleSaveTicket = async () => {
    if (!ticketNome.trim() || !ticketQtd || !id) return;
    try {
      await createTicket.mutateAsync({
        event_id: id,
        name: ticketNome.trim(),
        type: dialogType!,
        quantity: parseInt(ticketQtd, 10),
        price_brl: dialogType === "pago" ? parseFloat(ticketPreco.replace(",", ".")) : 0,
        visibility: "public",
        status: "active",
      });
      setTicketNome(""); setTicketQtd(""); setTicketPreco(""); setDialogType(null);
      toast({ title: "Ingresso adicionado!", description: `"${ticketNome.trim()}" foi criado com sucesso.` });
    } catch (e: any) {
      toast({ title: "Erro ao salvar ingresso", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicket.mutateAsync(ticketId);
      toast({ title: "Ingresso removido." });
    } catch (e: any) {
      toast({ title: "Erro ao remover ingresso", description: e.message, variant: "destructive" });
    }
  };

  const filteredTickets = tickets.filter((t) =>
    t.name.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  const tabs = [
    { label: "Informações gerais", icon: Info },
    { label: "Página do evento", icon: Globe },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos`, active: true },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare, route: `/organizador/evento/${id}/configuracoes/mensagem` },
  ];

  const canSave = ticketNome.trim() !== "" && ticketQtd !== "" &&
    (dialogType !== "pago" || ticketPreco.trim() !== "");

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
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}>
            Voltar para o painel do evento
          </Button>
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100"
            onClick={() => navigate("/organizador/meus-eventos")}>
            Meus eventos
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button key={tab.label} type="button" onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active ? "bg-emerald-50 text-[#004d00]" : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}>
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
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={() => { setTicketNome(""); setTicketQtd(""); setTicketPreco(""); setDialogType("pago"); }}>
              + Ingresso pago
            </Button>
            <Button variant="outline" className="border-emerald-200 bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
              onClick={() => { setTicketNome(""); setTicketQtd(""); setTicketPreco(""); setDialogType("gratuito"); }}>
              + Ingresso gratuito
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar..." value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Quantidade</th>
                  <th className="px-4 py-3 text-left font-medium">Preço</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                      Nenhum ingresso cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{t.name}</td>
                      <td className="px-4 py-3">{t.quantity}</td>
                      <td className="px-4 py-3">{t.price_cents === 0 ? "Grátis" : `R$ ${(t.price_cents / 100).toFixed(2).replace(".", ",")}`}</td>
                      <td className="px-4 py-3 capitalize">{t.type}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">{t.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteTicket(t.id)}
                          className="text-slate-400 hover:text-red-500 transition text-lg leading-none" title="Remover">×</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!dialogType} onOpenChange={(open) => !open && setDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar ingresso {dialogType === "pago" ? "pago" : "gratuito"}</DialogTitle>
            <DialogDescription>Preencha os dados do novo ingresso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome</label>
              <Input placeholder="Nome do ingresso" value={ticketNome} onChange={(e) => setTicketNome(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Quantidade</label>
              <Input placeholder="0" type="number" min="1" value={ticketQtd} onChange={(e) => setTicketQtd(e.target.value)} />
            </div>
            {dialogType === "pago" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Preço (R$)</label>
                <Input placeholder="0,00" value={ticketPreco} onChange={(e) => setTicketPreco(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>Cancelar</Button>
            <Button disabled={!canSave} onClick={handleSaveTicket} className="bg-[#004d00] text-white hover:bg-[#003a00]">
              Salvar ingresso
            </Button>
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
  const { data: registrations = [], isLoading } = useRegistrations(id);

  const filteredParticipants = registrations.filter((participant) => {
    const query = search.toLowerCase();
    return (
      participant.full_name.toLowerCase().includes(query) ||
      (participant.email ?? "").toLowerCase().includes(query)
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
        <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => navigate("/minha-conta")}>Atualizar dados</Button>
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
                  <th className="px-4 py-3 text-left font-medium">E-mail</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Data de inscrição</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                      Nenhum dado adicionado.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{participant.full_name}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.email}</td>
                      <td className="px-4 py-3 text-slate-500">{participant.status}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {participant.registered_at ? new Date(participant.registered_at).toLocaleDateString("pt-BR") : "-"}
                      </td>
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
        <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => navigate("/minha-conta")}>Atualizar dados</Button>
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

const gerarCodigo = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const OrganizerEventCuponsPage = () => {
  const navigate = useNavigate();
  const { id: eventId = "default" } = useParams();
  const { toast } = useToast();
  const { data: event } = useEvent(eventId);
  const { data: cupons = [] } = useCoupons(eventId);
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const [openDialog, setOpenDialog] = useState(false);
  const [busca, setBusca] = useState("");
  const [deleteCupomId, setDeleteCupomId] = useState<string | null>(null);

  const [formCodigo, setFormCodigo] = useState("");
  const [formModo, setFormModo] = useState<"percentual" | "fixo" | "">("");
  const [formValor, setFormValor] = useState("");
  const [formMaximo, setFormMaximo] = useState("");

  const resetForm = () => {
    setFormCodigo("");
    setFormModo("");
    setFormValor("");
    setFormMaximo("");
  };

  const handleOpenDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleGerar = () => {
    setFormCodigo(gerarCodigo());
  };

  const handleSalvar = async () => {
    if (!formCodigo.trim() || !formModo || !formValor.trim()) {
      toast({ title: "Campos obrigatórios", description: "Preencha código, modo e valor.", variant: "destructive" });
      return;
    }
    if (!event?.organization_id) {
      toast({ title: "Evento não encontrado", description: "Não foi possível identificar a organização do evento.", variant: "destructive" });
      return;
    }
    const code = formCodigo.trim().toUpperCase();
    const ja = cupons.find((c) => c.code.toUpperCase() === code);
    if (ja) {
      toast({ title: "Código duplicado", description: "Já existe um cupom com esse código.", variant: "destructive" });
      return;
    }
    try {
      await createCoupon.mutateAsync({
        organization_id: event.organization_id,
        event_id: eventId,
        code,
        discount_kind: formModo === "percentual" ? "percent" : "fixed",
        discount_value: Number(formValor.replace(",", ".")),
        max_uses: formMaximo.trim() ? parseInt(formMaximo, 10) : null,
        starts_at: null,
        expires_at: null,
        active: true,
      });
      setOpenDialog(false);
      toast({ title: "Cupom criado", description: `Cupom "${code}" adicionado com sucesso.` });
    } catch (e: any) {
      toast({ title: "Erro ao criar cupom", description: e.message, variant: "destructive" });
    }
  };

  const handleToggleAtivo = async (id: string, active: boolean) => {
    try {
      await updateCoupon.mutateAsync({ id, active: !active });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar cupom", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteCupom = async () => {
    if (!deleteCupomId) return;
    try {
      await deleteCoupon.mutateAsync(deleteCupomId);
      toast({ title: "Cupom excluído", description: "O cupom foi removido permanentemente." });
    } catch (e: any) {
      toast({ title: "Erro ao excluir cupom", description: e.message, variant: "destructive" });
    }
    setDeleteCupomId(null);
  };

  const cuponsFiltrados = cupons.filter((c) =>
    c.code.toLowerCase().includes(busca.toLowerCase())
  );

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
        <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => navigate("/minha-conta")}>Atualizar dados</Button>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="w-fit border-b-4 border-[#004d00] pb-1">
              <CardTitle className="text-lg">Cupons de desconto</CardTitle>
            </div>
          </div>
          <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={handleOpenDialog}>
            + Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
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
                {cuponsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bg-slate-50 px-4 py-12 text-center text-slate-500">
                      Nenhum dado adicionado.
                    </td>
                  </tr>
                ) : (
                  cuponsFiltrados.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{c.code}</td>
                      <td className="px-4 py-3 text-slate-600">{c.discount_kind === "percent" ? "Porcentagem" : "Valor Fixo"}</td>
                      <td className="px-4 py-3 text-slate-600">{c.discount_kind === "percent" ? `${c.discount_value}%` : `R$ ${c.discount_value}`}</td>
                      <td className="px-4 py-3 text-slate-600">{c.max_uses ?? "∞"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {c.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAtivo(c.id, c.active)}
                            className="text-xs text-slate-500 hover:text-[#004d00] underline"
                          >
                            {c.active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => setDeleteCupomId(c.id)}
                            className="text-xs text-red-400 hover:text-red-600 underline"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">Exibindo {cuponsFiltrados.length} cupom(ns)</span>
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
              <div className="flex gap-2">
                <Input
                  placeholder="EX: PROMO10"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button type="button" variant="outline" onClick={handleGerar} className="shrink-0">
                  Gerar
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Modo</label>
              <Select value={formModo} onValueChange={(v) => setFormModo(v as "percentual" | "fixo")}>
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
              <label className="text-sm font-medium">
                {formModo === "percentual" ? "Valor (%)" : formModo === "fixo" ? "Valor (R$)" : "Valor"}
              </label>
              <Input
                placeholder="0"
                value={formValor}
                onChange={(e) => setFormValor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Limite de Uso (Máximo)</label>
              <Input
                placeholder="Deixe vazio para ilimitado"
                type="number"
                value={formMaximo}
                onChange={(e) => setFormMaximo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={handleSalvar}>
              Salvar cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCupomId} onOpenChange={(open) => !open && setDeleteCupomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente este cupom? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCupom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => navigate("/minha-conta")}>Atualizar dados</Button>
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
        <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={() => navigate("/minha-conta")}>Atualizar dados</Button>
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
    { label: "Mensagens", icon: MessageSquare, route: `/organizador/evento/${id}/configuracoes/mensagem` },
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
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={() => navigate("/organizadores")}>+ Adicionar organizador</Button>
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


          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria do evento</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acampamentos">Acampamentos</SelectItem>
                  <SelectItem value="catequese">Catequese</SelectItem>
                  <SelectItem value="congressos">Congressos e Seminários</SelectItem>
                  <SelectItem value="cursos">Cursos e Workshops</SelectItem>
                  <SelectItem value="encontros">Encontros de Formação</SelectItem>
                  <SelectItem value="diversos">Eventos Diversos</SelectItem>
                  <SelectItem value="palestras">Palestras</SelectItem>
                  <SelectItem value="retiros">Retiros</SelectItem>
                  <SelectItem value="seminario-espirito">Seminário de Vida no Espírito Santo</SelectItem>
                  <SelectItem value="shows">Shows Católicos</SelectItem>
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

  // Refs para inputs de arquivo ocultos
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const mobileImageInputRef = useRef<HTMLInputElement>(null);
  const webImageInputRef    = useRef<HTMLInputElement>(null);

  // Previews das imagens de divulgação
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [webPreview,    setWebPreview]    = useState<string | null>(null);

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

  // Insere imagem base64 no editor Tiptap
  const handleEditorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Gera preview para as imagens de divulgação
  const handleDivulgacaoImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, active: true },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare, route: `/organizador/evento/${id}/configuracoes/mensagem` },
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
            <button
              type="button"
              className={toolbarButton()}
              onClick={() => editorImageInputRef.current?.click()}
              title="Inserir imagem"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input
              ref={editorImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleEditorImageChange}
            />
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
          {/* Input ocultos para upload */}
          <input
            ref={mobileImageInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleDivulgacaoImage(e, setMobilePreview)}
          />
          <input
            ref={webImageInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleDivulgacaoImage(e, setWebPreview)}
          />

          {/* Mobile */}
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            {mobilePreview ? (
              <img
                src={mobilePreview}
                alt="Preview mobile"
                className="mx-auto h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#004d00]">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Imagem da divulgação mobile</p>
              <p className="text-xs text-muted-foreground">400px x 300px · JPEG ou PNG · até 3MB</p>
            </div>
            <Button
              variant="outline"
              className="mx-auto border-slate-300 text-slate-600 hover:bg-white"
              onClick={() => mobileImageInputRef.current?.click()}
            >
              {mobilePreview ? "Trocar imagem" : "Selecionar imagem"}
            </Button>
          </div>

          {/* Web */}
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            {webPreview ? (
              <img
                src={webPreview}
                alt="Preview web"
                className="mx-auto h-32 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#004d00]">
                <Upload className="h-6 w-6" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Imagem da divulgação web</p>
              <p className="text-xs text-muted-foreground">1400px x 733px · JPEG ou PNG · até 5MB</p>
            </div>
            <Button
              variant="outline"
              className="mx-auto border-slate-300 text-slate-600 hover:bg-white"
              onClick={() => webImageInputRef.current?.click()}
            >
              {webPreview ? "Trocar imagem" : "Selecionar imagem"}
            </Button>
          </div>
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
    { label: "Mensagens", icon: MessageSquare, route: `/organizador/evento/${id}/configuracoes/mensagem` },
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
  const { toast } = useToast();

  const { data: eventData } = useEvent(id);
  const updateEvent = useUpdateEvent();
  const eventName = eventData?.name ?? id ?? "";

  const [nameEnabled, setNameEnabled] = useState<boolean>(true);
  const [emailEnabled, setEmailEnabled] = useState<boolean>(true);
  const [cpfEnabled, setCpfEnabled] = useState<boolean>(true);
  const [birthEnabled, setBirthEnabled] = useState<boolean>(false);
  const [phoneEnabled, setPhoneEnabled] = useState<boolean>(true);
  const [customFields, setCustomFields] = useState<{ id: string; label: string; enabled: boolean }[]>([]);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  useEffect(() => {
    if (!eventData) return;
    const sf: any = eventData.show_fields ?? {};
    setNameEnabled(sf.nome ?? true);
    setEmailEnabled(sf.email ?? true);
    setCpfEnabled(sf.cpf ?? true);
    setBirthEnabled(sf.nascimento ?? false);
    setPhoneEnabled(sf.whatsapp ?? true);
    const cf: any[] = Array.isArray(eventData.custom_fields) ? eventData.custom_fields : [];
    setCustomFields(cf.map((f: any) => ({ id: f.id, label: f.label, enabled: true })));
  }, [eventData]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateEvent.mutateAsync({
        id,
        show_fields: {
          nome: nameEnabled,
          email: emailEnabled,
          cpf: cpfEnabled,
          nascimento: birthEnabled,
          whatsapp: phoneEnabled,
        } as any,
        custom_fields: customFields
          .filter((f) => f.enabled)
          .map((f) => ({ id: f.id, label: f.label, type: "text", required: true })) as any,
      });
      toast({ title: "Formulário salvo!", description: "As configurações foram atualizadas para os participantes." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, route: `/organizador/evento/${id}/configuracoes/pagina` },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, active: true },
    { label: "Mensagens", icon: MessageSquare, route: `/organizador/evento/${id}/configuracoes/mensagem` },
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

          {customFields.map((cf) => (
            <div key={cf.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2 sm:flex-1">
                <label className="text-sm font-medium text-slate-700">{cf.label}</label>
                <Input disabled placeholder={cf.label} className="bg-slate-50" />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={cf.enabled}
                  onCheckedChange={(val) =>
                    setCustomFields((prev) =>
                      prev.map((f) => (f.id === cf.id ? { ...f, enabled: val } : f))
                    )
                  }
                  className="data-[state=checked]:bg-[#004d00]"
                />
                <button
                  type="button"
                  onClick={() => setCustomFields((prev) => prev.filter((f) => f.id !== cf.id))}
                  className="text-slate-400 hover:text-red-500 transition text-lg leading-none"
                  title="Remover campo"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-fit border-emerald-100 bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
            onClick={() => { setNewFieldLabel(""); setAddFieldOpen(true); }}
          >
            + Adicionar campo
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={handleSave}>Salvar configurações do formulário</Button>
      </div>

      <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar campo</DialogTitle>
            <DialogDescription>Informe o nome do campo que deseja adicionar ao formulário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do campo</label>
            <Input
              placeholder="Ex: RG, Diocese, Paróquia..."
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFieldLabel.trim()) {
                  setCustomFields((prev) => [
                    ...prev,
                    { id: Date.now().toString(), label: newFieldLabel.trim(), enabled: true },
                  ]);
                  setAddFieldOpen(false);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFieldOpen(false)}>Cancelar</Button>
            <Button
              className="bg-[#004d00] text-white hover:bg-[#003a00]"
              disabled={!newFieldLabel.trim()}
              onClick={() => {
                setCustomFields((prev) => [
                  ...prev,
                  { id: Date.now().toString(), label: newFieldLabel.trim(), enabled: true },
                ]);
                setAddFieldOpen(false);
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <ThemeProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/role-select" element={<ProtectedRoute><RoleSelectPage /></ProtectedRoute>} />
            <Route path="/evento/:slug" element={<PublicEventPage />} />
            <Route path="/planos" element={<PlansPage />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              {/* Organizer Routes */}
              <Route element={<RoleRoute requiredRole="organizer" />}>
                <Route path="/organizador/home" element={<DashboardPage />} />
                <Route path="/organizador/meus-eventos" element={<OrganizerEventsPage />} />
                <Route path="/organizador/eventos/categorias" element={<OrganizerEventsPage />} />
                <Route path="/organizador/evento/novo" element={<OrganizerEventNewPage />} />
                <Route path="/organizador/evento/:id/visualizar" element={<OrganizerEventPreviewPage />} />
                <Route path="/organizador/evento/:id/dashboard" element={<OrganizerEventDashboardPage />} />
                <Route path="/organizador/evento/:id/ingressos" element={<OrganizerEventIngressosPage />} />
                <Route path="/organizador/evento/:id/participantes" element={<OrganizerEventParticipantesPage />} />
                <Route path="/organizador/evento/:id/fila-de-espera" element={<OrganizerEventFilaDeEsperaPage />} />
                <Route path="/organizador/evento/:id/financeiro" element={<OrganizerEventFinanceiroPage />} />
                <Route path="/organizador/evento/:id/financeiro/cupons" element={<OrganizerEventCuponsPage />} />
                <Route path="/organizador/evento/:id/financeiro/repasse" element={<FinanceiroRepassePage />} />
                <Route path="/organizador/evento/:id/configuracoes" element={<OrganizerEventConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/pagina" element={<OrganizerEventPaginaConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/pagamento" element={<OrganizerEventPagamentoConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/formulario" element={<OrganizerEventFormularioConfiguracoesPage />} />
                <Route path="/organizador/evento/:id/configuracoes/mensagem" element={<OrganizerEventMensagensPage />} />
                <Route path="/organizador/evento/:id/checkins" element={<CheckinsPage />} />
                <Route path="/organizador/evento/:id/checkins/tipos" element={<CheckinsTiposPage />} />
                <Route path="/organizador/evento/:id/checkins/realizados" element={<CheckinsRealizadosPage />} />
                <Route path="/crm" element={<Navigate to="/crm/pessoas" replace />} />
                <Route path="/crm/:section" element={<CRMPage />} />
              </Route>

              {/* Participant Routes */}
              <Route element={<RoleRoute requiredRole="participant" />}>
                <Route path="/participante/meus-ingressos" element={<MyTicketsPage />} />
                <Route path="/participante/meus-ingressos/:id" element={<MyTicketDetailPage />} />
                <Route path="/participante/explorar" element={<ExploreEventsPage />} />
              </Route>

              {/* Common Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/organizadores" element={<OrganizadoresPage />} />
              <Route path="/minha-conta" element={<MinhaContaPage />} />
            </Route>

            <Route path="/organizador/dashboard" element={<Navigate to="/organizador/home" replace />} />

            {/* Admin Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminHomePage />} />
              <Route path="/admin/usuarios" element={<AdminUsersPage />} />
              <Route path="/admin/eventos" element={<AdminEventsPage />} />
              <Route path="/admin/organizadores" element={<AdminOrganizersPage />} />
              <Route path="/admin/repasses" element={<AdminPayoutsPage />} />
              <Route path="/admin/moderacao" element={<AdminModerationPage />} />
              <Route path="/admin/logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/financeiro" element={<AdminFinancialPage />} />
              <Route path="/admin/configuracoes" element={<AdminSettingsPage />} />
            </Route>

            {/* SuperAdmin Dashboard — gate adicional via user_roles (server-side) */}
            <Route
              element={
                <ProtectedRoute>
                  <SuperAdminRoute>
                    <AdminLayout />
                  </SuperAdminRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
