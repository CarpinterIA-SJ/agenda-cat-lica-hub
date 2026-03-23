import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, Save, Plus, Trash2, CheckCircle2, 
  Info, MessageCircle, Mail, Phone, Globe, Lock,
  ChevronDown, Eye, CreditCard, QrCode, FileText, Settings, User, Fingerprint, Calendar, Ticket,
  MessageSquare, Bold, Italic, Underline, Strikethrough, PlusCircle, ChevronRight
} from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Ticket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sale_limit: string;
}

interface FormField {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox" | "email" | "tel" | "number" | "date";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface EventFormData {
  id: string;
  name: string;
  organizer: string;
  category: string;
  date: string;
  time: string;
  location: string;
  type: string;
  is_free: boolean;
  status: string;
  description: string;
  image: string;
  tickets: any[];
  custom_fields: any[];
  
  // Toggles de visibilidade do formulário
  show_nome: boolean;
  show_email: boolean;
  show_cpf: boolean;
  show_nascimento: boolean;
  show_whatsapp: boolean;

  // Mensagens
  msg_confirm_whatsapp: string;
  msg_waitlist_whatsapp: string;
  msg_confirm_email: string;
  msg_waitlist_email: string;
  msg_ticket_pdf: string;
  msg_recovery_pix: string;
  msg_recovery_boleto: string;

  // Pagamento
  pix_enabled: boolean;
  pix_key: string;
  pix_deadline: string;
  pix_deadline_unit: string;
  card_enabled: boolean;
  boleto_enabled: boolean;
  boleto_deadline: string;
}

const TAB_ORDER = ["general", "page", "tickets", "payment", "form", "messages"];

const RichTextEditor = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      Placeholder.configure({ placeholder: placeholder || 'Escreva sua mensagem...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`{{${variable}}}`).run();
  };

  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm border-gray-200 focus-within:border-blue-500 transition-colors">
      <div className="bg-gray-50/50 border-b p-2 flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : ''}`}><Bold className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : ''}`}><Italic className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-gray-200 text-blue-600' : ''}`}><Underline className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={`h-8 w-8 p-0 ${editor.isActive('strike') ? 'bg-gray-200 text-blue-600' : ''}`}><Strikethrough className="w-4 h-4" /></Button>
        
        <div className="w-[1px] h-4 bg-gray-300 mx-1" />
        
        <div className="flex items-center gap-2 ml-auto pr-2">
           <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-2" onClick={() => insertVariable('nome')}>+ {"{{nome}}"}</Button>
           <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg px-2" onClick={() => insertVariable('nome_evento')}>+ {"{{nome_evento}}"}</Button>
        </div>
      </div>
      <EditorContent editor={editor} className="p-4 min-h-[150px] focus:outline-none prose prose-sm max-w-none" />
      <style>{`
        .ProseMirror:focus { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
};

const CATEGORIES = [
  "Eventos Diversos", "Retiros", "Cursos e Workshops", "Encontros de Formação", 
  "Shows Católicos", "Congressos ou Seminários", "Acampamentos", "Palestras", "Catequese"
];

const EventCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  
  const userLabel = user ? `${user.user_metadata?.full_name || 'Usuário'} - (${user.email})` : "Carregando...";

  // Estado Global do Formulário
  const [formData, setFormData] = useState({
    // Geral
    name: "",
    category: "",
    organizer: userLabel,
    support_whatsapp: "",
    support_email: user?.email || "",
    visibility: "public" as "public" | "private",
    start_date: "",
    end_date: "",
    location: "",
    custom_url: "",
    description: "",
    // Ingressos
    ticket_nomenclature: "Inscrição" as "Ingresso" | "Inscrição",
    tickets: [] as Ticket[],
    is_free: false,
    has_coupon: false,
    // Página
    cover_image: null as File | null,
    page_content: "",
    // Pagamento
    payment_methods: [] as string[],
    pix_enabled: false,
    pix_deadline: "",
    pix_deadline_unit: "Minutos", // Renamed from pix_unit
    boleto_enabled: false,
    boleto_deadline: "",
    card_enabled: false,
    auto_cancel_expired: true,
    pix_key: "",
    coupon_code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    coupon_expiry: "",
    // Formulário
    show_nome: true,
    show_email: true,
    show_cpf: true,
    show_nascimento: true,
    show_whatsapp: true,
    custom_fields: [] as FormField[],
    
    // Mensagens Default
    msg_confirm_whatsapp: "Olá {{nome}} 😊!\n\nSua Inscrição foi realizada com sucesso para o evento {{nome_evento}}!\n\nVerifique o arquivo em Anexo com os ingressos de entrada ao evento.\n\nEm cada ingresso conterá um QR Code que será lido na entrada do evento para realização de check-in.\n\nAtenciosamente,\n\nEquipe Agenda Católica",
    msg_waitlist_whatsapp: "",
    msg_confirm_email: "",
    msg_waitlist_email: "",
    msg_ticket_pdf: "",
    msg_recovery_pix: "",
    msg_recovery_boleto: "",

    // Termos
    agreed_terms: false,
  });

  // Atualiza o e-mail de suporte quando o usuário carrega
  useEffect(() => {
    if (user?.email && !formData.support_email) {
      setFormData(prev => ({ ...prev, support_email: user.email, organizer: userLabel }));
    }
  }, [user]);

  // Lógica para sincronizar ingressos gratuitos
  useEffect(() => {
    if (formData.is_free) {
      const freeTicket: Ticket = {
        id: "default-free",
        name: formData.ticket_nomenclature === "Ingresso" ? "Ingresso Gratuito" : "Inscrição Gratuita",
        price: 0,
        quantity: 100,
        sale_limit: "",
      };
      setFormData(prev => ({ ...prev, tickets: [freeTicket] }));
    }
  }, [formData.is_free, formData.ticket_nomenclature]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      label: "",
      type: "text",
      required: false,
    };
    setFormData(prev => ({ ...prev, custom_fields: [...prev.custom_fields, newField] }));
  };

  const handleAddTicket = () => {
    if (formData.is_free) {
      toast.info("Eventos gratuitos possuem apenas um ingresso padrão.");
      return;
    }
    const newTicket: Ticket = {
      id: Date.now().toString(),
      name: "",
      price: 0,
      quantity: 1,
      sale_limit: "",
    };
    setFormData(prev => ({ ...prev, tickets: [...prev.tickets, newTicket] }));
  };

  const handleRemoveItem = (collection: "tickets" | "custom_fields", id: string) => {
    setFormData(prev => ({
      ...prev,
      [collection]: (prev[collection] as any[]).filter(item => item.id !== id)
    }));
  };

  const validateTab = (tab: string) => {
    if (tab === "general") {
      if (!formData.name || !formData.category || !formData.start_date) {
        toast.error("Preencha os campos obrigatórios (*)");
        return false;
      }
    }
    return true;
  };

  const handleSaveAndNext = () => {
    if (!validateTab(activeTab)) return;

    const currentIndex = TAB_ORDER.indexOf(activeTab);
    if (currentIndex < TAB_ORDER.length - 1) {
      const nextTab = TAB_ORDER[currentIndex + 1];
      setActiveTab(nextTab);
      toast.success("Progresso salvo com sucesso!");
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = () => {
    if (!formData.agreed_terms) {
      toast.error("Você deve concordar com os termos de uso.");
      return;
    }

    // Persistência em LocalStorage
    try {
      const existingEvents = JSON.parse(localStorage.getItem("custom_events") || "[]");
      const newEvent = {
        id: Date.now(),
        name: formData.name,
        date: new Date(formData.start_date).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' }),
        location: formData.location || "Local não informado",
        type: formData.is_free ? "Gratuito" : "Pago",
        attendees: 0,
        status: "Ativo",
        ...formData
      };
      localStorage.setItem("custom_events", JSON.stringify([newEvent, ...existingEvents]));
      
      toast.success("Evento Criado e Salvo com Sucesso!", {
        description: "As configurações foram salvas e o evento já aparece na sua lista.",
      });
      setTimeout(() => navigate("/events"), 1500);
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast.error("Erro ao salvar evento localmente.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 relative font-sans">
      {/* Botão Flutuante WhatsApp */}
      <a 
        href="https://wa.me/5500000000000" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </a>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="mb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 py-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">
              {user?.user_metadata?.full_name || "Organizador"}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate("/events")}>Meus eventos</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 font-bold">{formData.name || "Novo Evento"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-gray-200 text-blue-600 font-bold h-10 px-4 rounded-xl gap-2 hover:bg-gray-50 bg-white" onClick={() => navigate("/events")}>
              <ArrowLeft className="w-4 h-4" /> Voltar para o painel do evento
            </Button>
            <Button variant="outline" className="border-gray-200 text-blue-600 font-bold h-10 px-4 rounded-xl hover:bg-gray-50 bg-white" onClick={() => navigate("/events")}>
              Meus eventos
            </Button>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/30 p-1 mb-6 border">
          {TAB_ORDER.map((tab, i) => (
            <TabsTrigger 
              key={tab} 
              value={tab} 
              className="data-[state=active]:bg-[#007600] data-[state=active]:text-white transition-all capitalize flex items-center gap-2 px-4 py-2"
            >
              <span className="opacity-50 text-[10px] font-bold">{i + 1}</span>
              {tab === "general" && <><Info className="w-4 h-4" /> Geral</>}
              {tab === "page" && <><Globe className="w-4 h-4" /> Página</>}
              {tab === "tickets" && <><Ticket className="w-4 h-4" /> Ingressos</>}
              {tab === "payment" && <><CreditCard className="w-4 h-4" /> Pagamento</>}
              {tab === "form" && <><Fingerprint className="w-4 h-4" /> Formulário</>}
              {tab === "messages" && <><MessageSquare className="w-4 h-4" /> Mensagens</>}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* --- ABA 1: INFORMAÇÕES GERAIS --- */}
        <TabsContent value="general" className="mt-0 space-y-8 animate-in fade-in duration-500">
          <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-[#007600]" /> Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Nome e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nome do Evento <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Retiro de Quaresma 2026" 
                    className="h-11 focus-visible:ring-[#007600]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Categoria do evento <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => handleInputChange("category", v)}
                  >
                    <SelectTrigger className="h-11 focus:ring-[#007600]">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção Organizador */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Selecionar o organizador do evento</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={formData.organizer} onValueChange={(v) => handleInputChange("organizer", v)}>
                    <SelectTrigger className="h-11 flex-1 focus:ring-[#007600]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={userLabel}>{userLabel}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-11 px-6 border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 transition-colors gap-2">
                    <Plus className="w-4 h-4" /> Adicionar organizador
                  </Button>
                </div>

                {/* Alerta de Atenção */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-blue-900 text-sm">Atenção!</p>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      As notificações do sistema, confirmações de pagamento e avisos importantes serão enviados para o e-mail do organizador selecionado. Você também poderá visualizar as mensagens pelo botão de WhatsApp fixado ao lado.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Whatsapp de suporte</Label>
                    <div className="flex">
                      <div className="h-11 px-3 flex items-center bg-muted border border-r-0 rounded-l-md text-sm font-medium">
                        <span className="mr-2">🇧🇷</span> +55
                      </div>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        value={formData.support_whatsapp} 
                        onChange={(e) => handleInputChange("support_whatsapp", e.target.value)}
                        className="rounded-l-none h-11 focus-visible:ring-[#007600]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">E-mail de suporte</Label>
                    <Input 
                      type="email" 
                      placeholder="email@exemplo.com" 
                      value={formData.support_email} 
                      onChange={(e) => handleInputChange("support_email", e.target.value)}
                      className="h-11 focus-visible:ring-[#007600]"
                    />
                  </div>
                </div>
              </div>

              {/* Visibilidade do Evento */}
              <div className="space-y-4 pt-2">
                <Label className="text-sm font-semibold">Visibilidade do evento</Label>
                <RadioGroup 
                  defaultValue="public" 
                  value={formData.visibility} 
                  onValueChange={(v: any) => handleInputChange("visibility", v)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <Label 
                    htmlFor="public" 
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/10 ${formData.visibility === 'public' ? 'border-[#007600] bg-[#007600]/5 ring-1 ring-[#007600]' : 'border-border'}`}
                  >
                    <RadioGroupItem value="public" id="public" className="mt-1 text-[#007600]" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5"><Globe className="w-4 h-4 text-[#007600]" /> Meu evento é público</div>
                      <p className="text-xs text-muted-foreground font-normal mt-1">Seu evento fica visível em toda a plataforma.</p>
                    </div>
                  </Label>
                  <Label 
                    htmlFor="private" 
                    className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-muted/10 ${formData.visibility === 'private' ? 'border-[#007600] bg-[#007600]/5 ring-1 ring-[#007600]' : 'border-border'}`}
                  >
                    <RadioGroupItem value="private" id="private" className="mt-1 text-[#007600]" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5"><Lock className="w-4 h-4 text-[#007600]" /> Meu evento é privado</div>
                      <p className="text-xs text-muted-foreground font-normal mt-1">Apenas pessoas com o link do seu evento podem visualizá-lo.</p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Datas e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-[#007600]">O evento será Gratuito ou Pago?</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className={`flex-1 h-11 border-2 font-bold ${!formData.is_free ? 'bg-[#007600] text-white border-[#007600] hover:bg-[#006000]' : 'hover:border-[#007600] text-[#007600]'}`}
                      onClick={() => handleInputChange("is_free", false)}
                    >PAGO</Button>
                    <Button 
                      variant="outline"
                      className={`flex-1 h-11 border-2 font-bold ${formData.is_free ? 'bg-[#007600] text-white border-[#007600] hover:bg-[#006000]' : 'hover:border-[#007600] text-[#007600]'}`}
                      onClick={() => handleInputChange("is_free", true)}
                    >GRATUITO</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Data de Início <span className="text-red-500">*</span></Label>
                  <Input 
                    type="datetime-local" 
                    value={formData.start_date} 
                    onChange={(e) => handleInputChange("start_date", e.target.value)} 
                    className="h-11 focus-visible:ring-[#007600]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA 2: PÁGINA --- */}
        <TabsContent value="page" className="mt-0 animate-in slide-in-from-right duration-300">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-lg">Conteúdo da Página</CardTitle></CardHeader>
            <CardContent className="p-6">
              <Textarea 
                placeholder="Informações detalhadas para os participantes..." 
                rows={12} 
                className="focus-visible:ring-[#007600] text-base leading-relaxed"
                value={formData.page_content}
                onChange={(e) => handleInputChange("page_content", e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA 3: INGRESSOS --- */}
        <TabsContent value="tickets" className="mt-0 space-y-6 animate-in slide-in-from-right duration-300">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nomenclatura do ingresso</Label>
                  <Select 
                    value={formData.ticket_nomenclature} 
                    onValueChange={(v: any) => handleInputChange("ticket_nomenclature", v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ingresso">Ingresso</SelectItem>
                      <SelectItem value="Inscrição">Inscrição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-[#007600]/5 border-[#007600]/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-[#007600]">Cupom de Desconto?</Label>
                    <p className="text-[10px] text-muted-foreground">Permite códigos promocionais na compra</p>
                  </div>
                  <Switch 
                    checked={formData.has_coupon} 
                    onCheckedChange={(v) => handleInputChange("has_coupon", v)}
                    disabled={formData.is_free}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.tickets.map((ticket, index) => (
            <Card key={ticket.id} className="border-none shadow-sm rounded-xl relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#007600]" />
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-bold text-[#007600] uppercase tracking-wider text-xs">{formData.ticket_nomenclature} #{index + 1}</h4>
                  {!formData.is_free && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem("tickets", ticket.id)} className="text-destructive h-8 px-2 hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 mr-1.5" /> Remover
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Nome do {formData.ticket_nomenclature}</Label>
                    <Input 
                      disabled={formData.is_free} 
                      value={ticket.name} 
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].name = e.target.value;
                        handleInputChange("tickets", newTickets);
                      }}
                      className="h-10 focus-visible:ring-[#007600]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Preço (R$)</Label>
                    <Input 
                      type="number" 
                      disabled={formData.is_free} 
                      value={ticket.price}
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].price = parseFloat(e.target.value);
                        handleInputChange("tickets", newTickets);
                      }}
                      className="h-10 focus-visible:ring-[#007600]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Quantidade</Label>
                    <Input 
                      type="number" 
                      value={ticket.quantity}
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].quantity = parseInt(e.target.value);
                        handleInputChange("tickets", newTickets);
                      }}
                      className="h-10 focus-visible:ring-[#007600]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!formData.is_free && (
            <Button variant="outline" className="w-full h-14 border-dashed border-[#007600]/30 text-[#007600] hover:bg-[#007600]/5 font-bold" onClick={handleAddTicket}>
              <Plus className="w-5 h-5 mr-2" /> Adicionar outro {formData.ticket_nomenclature}
            </Button>
          )}
        </TabsContent>

        {/* --- ABA 4: PAGAMENTO --- */}
        <TabsContent value="payment" className="mt-0 animate-in slide-in-from-right duration-300">
          <div className="space-y-6">
            <div className="pb-2 border-b-2 border-blue-100/50">
              <h3 className="text-xl font-bold text-foreground">Configuração de Formas de Pagamento</h3>
            </div>

            {formData.is_free ? (
              <Card className="border-none shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-12 text-center bg-[#007600]/5 rounded-2xl border border-dashed border-[#007600]/20">
                  <CheckCircle2 className="w-12 h-12 text-[#007600] mx-auto mb-4" />
                  <p className="font-bold text-lg text-[#007600]">Evento Gratuito</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">Os pagamentos são processados pela plataforma com valor R$ 0,00 automático.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Métodos de Pagamento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cartão de Crédito */}
                  <Card className={`border-2 transition-all ${formData.card_enabled ? 'border-blue-500 shadow-md' : 'border-border'}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <CreditCard className={`w-5 h-5 ${formData.card_enabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
                           <span className="font-bold">Cartão de Crédito</span>
                        </div>
                        <Switch 
                          checked={formData.card_enabled} 
                          onCheckedChange={(v) => handleInputChange("card_enabled", v)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">Libere o parcelamento em até 12x para seus participantes.</p>
                    </CardContent>
                  </Card>

                  {/* Pix */}
                  <Card className={`border-2 transition-all ${formData.pix_enabled ? 'border-blue-500 shadow-md' : 'border-border'}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <QrCode className={`w-5 h-5 ${formData.pix_enabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
                           <span className="font-bold">Pix</span>
                        </div>
                        <Switch 
                          checked={formData.pix_enabled} 
                          onCheckedChange={(v) => handleInputChange("pix_enabled", v)}
                        />
                      </div>
                      {formData.pix_enabled && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Prazo para pagamento <span className="text-red-500">*</span></Label>
                          <div className="flex gap-2">
                            <Input 
                              type="number" 
                              placeholder="0"
                              value={formData.pix_deadline}
                              onChange={(e) => handleInputChange("pix_deadline", e.target.value)}
                              className="h-9 focus-visible:ring-blue-500" 
                            />
                            <Select 
                              value={formData.pix_deadline_unit} 
                              onValueChange={(v) => handleInputChange("pix_deadline_unit", v)}
                            >
                              <SelectTrigger className="h-9 w-32 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Minutos">Minutos</SelectItem>
                                <SelectItem value="Horas">Horas</SelectItem>
                                <SelectItem value="Dias">Dias</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Boleto */}
                  <Card className={`border-2 transition-all ${formData.boleto_enabled ? 'border-blue-500 shadow-md' : 'border-border'}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <FileText className={`w-5 h-5 ${formData.boleto_enabled ? 'text-blue-500' : 'text-muted-foreground'}`} />
                           <span className="font-bold">Boleto</span>
                        </div>
                        <Switch 
                          checked={formData.boleto_enabled} 
                          onCheckedChange={(v) => handleInputChange("boleto_enabled", v)}
                        />
                      </div>
                      {formData.boleto_enabled && (
                        <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Prazo de vencimento <span className="text-red-500">*</span></Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              placeholder="0"
                              value={formData.boleto_deadline}
                              onChange={(e) => handleInputChange("boleto_deadline", e.target.value)}
                              className="h-9 focus-visible:ring-blue-500" 
                            />
                            <span className="text-sm font-medium text-muted-foreground">dias</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Chave PIX e Cupom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Chave PIX para recebimento <span className="text-red-500">*</span></Label>
                    <Input placeholder="E-mail, CPF ou Aleatória" value={formData.pix_key} onChange={(e) => handleInputChange("pix_key", e.target.value)} className="h-11 focus-visible:ring-blue-500" />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <div className="p-4 bg-muted/30 rounded-xl border flex items-center justify-between w-full">
                       <div>
                         <Label className="text-sm font-bold">Cupom de Desconto?</Label>
                         <p className="text-[10px] text-muted-foreground">Adicionar códigos promocionais</p>
                       </div>
                       <Switch 
                          checked={formData.has_coupon} 
                          onCheckedChange={(v) => handleInputChange("has_coupon", v)}
                        />
                    </div>
                  </div>
                </div>

                {/* Alerta de Recebimentos */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 items-start shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-md shadow-blue-500/20">
                    <Info className="w-6 h-6" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-black text-blue-900 text-base uppercase tracking-tight">Como funciona os recebimentos:</h4>
                    <ul className="text-sm text-blue-700/90 space-y-2.5 font-medium list-none">
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        Você poderá sacar até 70% dos valores do evento, antes mesmo do evento acontecer através de antecipação.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        Em até 4 dias após a finalização do evento, 100% dos valores estarão disponíveis para o saque.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        Disponibilizamos a opção de parcelamento em até 12x (com juros) para o participante.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Configurações Gerais */}
                <div className="pt-4 border-t-2 border-blue-50">
                   <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                     <Settings className="w-4 h-4 text-blue-500" /> Configurações gerais
                   </h4>
                   <div className="flex items-center justify-between p-5 border rounded-2xl bg-white hover:bg-muted/5 transition-colors">
                      <div className="space-y-1">
                        <Label className="font-bold text-sm">Cancelar pedidos automaticamente</Label>
                        <p className="text-xs text-muted-foreground">Excluir pedidos após o prazo de pagamento expirado (conforme prazos acima)</p>
                      </div>
                      <Switch 
                        checked={formData.auto_cancel_expired} 
                        onCheckedChange={(v) => handleInputChange("auto_cancel_expired", v)}
                      />
                   </div>
                </div>

                {/* Botão Salvar Específico da Aba */}
                <div className="flex justify-end pt-4">
                   <Button 
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700 px-10 h-11 font-bold shadow-lg shadow-blue-600/20"
                    onClick={() => {
                      if (formData.boleto_enabled && !formData.boleto_deadline) {
                        toast.error("Informe o prazo de vencimento do Boleto");
                        return;
                      }
                      handleSaveAndNext();
                    }}
                   >
                     Salvar
                   </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="form" className="mt-0 space-y-8 animate-in slide-in-from-right duration-300">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <h3 className="text-xl font-bold text-foreground">Formulário de inscrição</h3>
              <div className="w-12 h-1 bg-[#007600] mt-1 rounded-full" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Campos Padrão com Toggles */}
              <div className="space-y-4">
                {[
                  { id: "show_nome", label: "Nome completo:", placeholder: "Digite o nome completo", icon: User },
                  { id: "show_email", label: "E-mail:", placeholder: "exemplo@email.com", icon: Mail },
                  { id: "show_cpf", label: "CPF:", placeholder: "___.___.___-__", icon: Fingerprint },
                  { id: "show_nascimento", label: "Data de nascimento:", placeholder: "__/__/____", icon: Calendar },
                  { id: "show_whatsapp", label: "Telefone (Whatsapp):", placeholder: "(__) _____-____", icon: Phone },
                ].map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex-1 space-y-1.5 pr-8">
                       <Label className="text-sm font-bold flex items-center gap-2 text-foreground/80">
                         <span className="text-red-500">*</span> {field.label}
                       </Label>
                       <Input 
                        disabled 
                        placeholder={field.placeholder} 
                        className="h-11 bg-white cursor-not-allowed border-gray-200" 
                       />
                    </div>
                    <Switch 
                      checked={(formData as any)[field.id]} 
                      onCheckedChange={(v) => handleInputChange(field.id, v)}
                      className="data-[state=checked]:bg-[#007600]"
                    />
                  </div>
                ))}
              </div>

              {/* Campos Personalizados */}
              {formData.custom_fields.length > 0 && (
                <div className="pt-6 space-y-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Perguntas Adicionais</h4>
                  {formData.custom_fields.map((field, index) => (
                    <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-end p-5 border rounded-2xl bg-white shadow-sm hover:border-[#007600]/30 transition-colors">
                      <div className="flex-1 w-full space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Pergunta / Rótulo</Label>
                        <Input 
                          placeholder="Ex: Qual sua pastoral?" 
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [...formData.custom_fields];
                            newFields[index].label = e.target.value;
                            handleInputChange("custom_fields", newFields);
                          }}
                          className="h-11 focus-visible:ring-[#007600]"
                        />
                      </div>
                      <div className="w-full sm:w-48 space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo</Label>
                        <Select 
                          value={field.type}
                          onValueChange={(v: any) => {
                            const newFields = [...formData.custom_fields];
                            newFields[index].type = v;
                            handleInputChange("custom_fields", newFields);
                          }}
                        >
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem("custom_fields", field.id)} className="h-11 w-11 text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="bg-[#007600]/10 text-[#007600] border-[#007600]/20 hover:bg-[#007600]/20 h-12 px-6 font-bold rounded-xl gap-2 transition-all flex items-center justify-center sm:w-auto w-full" 
                  onClick={handleAddField}
                >
                  <Plus className="w-5 h-5" /> Adicionar campo
                </Button>
              </div>

              <div className="flex justify-end pt-8">
                <Button 
                  className="bg-[#007600] hover:bg-[#006000] h-12 px-10 font-bold rounded-xl shadow-lg shadow-[#007600]/20"
                  onClick={handleSaveAndNext}
                >
                  Salvar campos customizados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PRÉ-VISUALIZAÇÃO DO FORMULÁRIO */}
          <Card className="border-2 border-[#007600]/20 shadow-lg rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-[#007600]/5 border-b border-[#007600]/10 flex flex-row items-center justify-between p-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#007600]">
                <Eye className="w-4 h-4" /> PRÉ-VISUALIZAÇÃO DO FORMULÁRIO
              </CardTitle>
              <span className="text-[10px] bg-[#007600] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Modo Visualização</span>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 opacity-60">
                  <Label className="text-xs font-semibold">Nome Completo</Label>
                  <Input readOnly placeholder="Ex: Maria da Silva" className="bg-muted/30 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5 opacity-60">
                  <Label className="text-xs font-semibold">E-mail</Label>
                  <Input readOnly placeholder="exemplo@email.com" className="bg-muted/30 cursor-not-allowed" />
                </div>
              </div>

              {formData.custom_fields.length > 0 ? (
                <div className="pt-4 border-t space-y-6">
                   {formData.custom_fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                       <Label className="text-sm font-bold text-foreground">
                        {field.label || "Pergunta sem rótulo"} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      {field.type === "text" && <Input readOnly placeholder={field.placeholder || "Resposta em texto..."} className="bg-muted/10" />}
                      {field.type === "email" && <Input readOnly type="email" placeholder="exemplo@email.com" className="bg-muted/10 cursor-not-allowed" />}
                      {field.type === "tel" && <Input readOnly type="tel" placeholder="(00) 00000-0000" className="bg-muted/10 cursor-not-allowed" />}
                      {field.type === "number" && <Input readOnly type="number" placeholder="0" className="bg-muted/10 cursor-not-allowed" />}
                      {field.type === "date" && <Input readOnly type="date" className="bg-muted/10 cursor-not-allowed" />}
                      {field.type === "select" && (
                        <div className="w-full h-11 border rounded-md flex items-center justify-between px-3 text-muted-foreground bg-muted/10">
                          {field.placeholder || "Selecione uma opção..."} <ChevronDown className="w-4 h-4" />
                        </div>
                      )}
                      {field.type === "checkbox" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed text-muted-foreground bg-muted/5">
                           <div className="w-5 h-5 border-2 rounded shrink-0" /> 
                           <span className="text-xs">O participante marcará esta caixa para concordar ou selecionar a opção.</span>
                        </div>
                      )}
                    </div>
                   ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground italic text-sm">
                  Nenhuma pergunta personalizada adicionada ainda.
                </div>
              )}

              <div className="pt-6">
                <Button disabled className="w-full bg-[#007600] opacity-50 font-bold uppercase h-12">
                   {formData.ticket_nomenclature === "Ingresso" ? "Confirmar Ingresso" : "Finalizar Inscrição"}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2 italic">Esta é apenas uma visão prévia de como o participante verá o formulário.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA 6: MENSAGENS E TERMOS --- */}
        <TabsContent value="messages" className="mt-0 space-y-8 animate-in slide-in-from-right duration-300">
          {[
            { id: 'msg_confirm_whatsapp', title: 'Mensagem para confirmação de inscrição - Whatsapp', type: 'whatsapp' },
            { id: 'msg_waitlist_whatsapp', title: 'Mensagem enviada após cadastro em fila de espera - Whatsapp', type: 'whatsapp' },
            { id: 'msg_confirm_email', title: 'Mensagem para confirmação de inscrição - E-mail', type: 'email' },
            { id: 'msg_waitlist_email', title: 'Mensagem enviada após cadastro em fila de espera - Email', type: 'email' },
            { id: 'msg_ticket_pdf', title: 'Mensagem para o ingresso (Comprovante de inscrição em PDF)', type: 'pdf' },
            { id: 'msg_recovery_pix', title: 'Mensagem para recuperação de pedido pendente - PIX (não pago)', type: 'recovery' },
            { id: 'msg_recovery_boleto', title: 'Mensagem para recuperação de pedido pendente - Boleto (não pago)', type: 'recovery' },
          ].map((msg) => (
            <Card key={msg.id} className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="pb-4">
                <h3 className="text-base font-bold text-foreground">{msg.title}</h3>
                <div className="w-12 h-1 bg-blue-600 mt-1 rounded-full" />
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {msg.type === 'whatsapp' && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3 text-blue-700">
                    <Info className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Os participantes sempre receberão notificações via Whatsapp, ao realizarem suas inscrições. Pode acontecer, em algumas situações de instabilidade da API do Whatsapp, em que essas mensagens personalizadas não sejam enviadas ao participante. Nesses casos, o sistema enviará uma mensagem padrão.
                    </p>
                  </div>
                )}
                
                <RichTextEditor 
                  value={(formData as any)[msg.id] || ""} 
                  onChange={(val) => handleInputChange(msg.id, val)} 
                  placeholder="Olá {{nome}}, sua inscrição foi realizada..."
                />
              </CardContent>
            </Card>
          ))}

          {/* Termos e Finalização */}
          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
            <CardContent className="p-6 pt-8 space-y-6">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Checkbox 
                  id="terms" 
                  checked={formData.agreed_terms} 
                  onCheckedChange={(v: boolean) => handleInputChange("agreed_terms", v)}
                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="terms" className="text-sm font-medium leading-relaxed cursor-pointer">
                  Concordo com os <a href="/terms" className="text-blue-600 underline font-bold" onClick={e => e.stopPropagation()}>termos de uso</a> e 
                  <a href="/privacy" className="text-blue-600 underline font-bold" onClick={e => e.stopPropagation()}> políticas de privacidade</a> da plataforma *
                </Label>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleFinalize} 
                  className="h-12 px-10 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl"
                  disabled={!formData.name || !formData.agreed_terms}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Fixo (Desktop) / Relativo (Mobile) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t mt-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/events")} 
          className="w-full sm:w-auto font-bold text-muted-foreground hover:text-foreground"
        >
          Sair sem salvar
        </Button>
        <Button 
          className="w-full sm:w-auto h-12 px-10 gap-2 font-bold bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg rounded-xl" 
          onClick={handleSaveAndNext}
        >
          <Save className="w-5 h-5" /> 
          {activeTab === "messages" ? "FINALIZAR CRIAÇÃO" : "SALVAR E CONTINUAR"}
        </Button>
      </div>
      </div>
    </div>
  );
};

export default EventCreatePage;
