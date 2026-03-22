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
  ChevronDown
} from "lucide-react";
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
  type: "text" | "select" | "checkbox";
  required: boolean;
}

const TAB_ORDER = ["general", "page", "tickets", "payment", "form", "messages"];

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
    pix_key: "",
    coupon_code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    coupon_expiry: "",
    // Formulário
    custom_fields: [] as FormField[],
    // Mensagens
    confirmation_msg: "",
    reminder_msg: "",
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
    if (tab === "messages") {
      if (!formData.agreed_terms) {
        toast.error("Você deve concordar com os termos de uso.");
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
    toast.success("Evento Criado com Sucesso!", {
      description: "As configurações foram salvas e seu evento está pronto.",
    });
    setTimeout(() => navigate("/events"), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16 relative font-sans">
      {/* Botão Flutuante WhatsApp */}
      <a 
        href="https://wa.me/5500000000000" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        <MessageCircle className="w-8 h-8" />
      </a>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")} className="hover:bg-muted/50">
          <ArrowLeft className="w-5 h-5 text-[#007600]" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Criar Novo Evento</h1>
          <p className="text-muted-foreground mt-0.5">Configure os detalhes do seu evento</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/30 p-1 mb-6 border">
          {TAB_ORDER.map((tab, i) => (
            <TabsTrigger 
              key={tab} 
              value={tab} 
              className="data-[state=active]:bg-[#007600] data-[state=active]:text-white transition-all capitalize"
            >
              {i + 1}. {tab === "general" ? "Geral" : tab === "page" ? "Página" : tab === "tickets" ? "Ingressos" : tab === "payment" ? "Pagamento" : tab === "form" ? "Formulário" : "Mensagens"}
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
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4"><CardTitle className="text-lg">Configurações de Pagamento</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              {formData.is_free ? (
                <div className="p-12 text-center bg-[#007600]/5 rounded-2xl border border-dashed border-[#007600]/20">
                  <CheckCircle2 className="w-12 h-12 text-[#007600] mx-auto mb-4" />
                  <p className="font-bold text-lg text-[#007600]">Evento Gratuito</p>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">Os pagamentos são processados pela plataforma com valor R$ 0,00 automático.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-w-md">
                    <Label className="text-sm font-semibold">Chave PIX para recebimento</Label>
                    <Input placeholder="E-mail, CPF ou Aleatória" value={formData.pix_key} onChange={(e) => handleInputChange("pix_key", e.target.value)} className="h-11 focus-visible:ring-[#007600]" />
                  </div>

                  {formData.has_coupon && (
                    <div className="p-6 border-2 border-dashed border-[#007600]/20 rounded-2xl bg-white space-y-6">
                      <h4 className="flex items-center gap-2 text-[#007600] font-bold">
                        <Plus className="w-5 h-5" /> CONFIGURAR CUPOM DE DESCONTO
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground">Código</Label>
                          <Input value={formData.coupon_code} onChange={(e) => handleInputChange("coupon_code", e.target.value.toUpperCase())} placeholder="EX: PASCOA20" className="h-11 font-mono uppercase" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground">Tipo</Label>
                          <Select value={formData.discount_type} onValueChange={(v: any) => handleInputChange("discount_type", v)}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentual (%)</SelectItem>
                              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground">Valor do Desconto</Label>
                          <Input type="number" value={formData.discount_value} onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value))} className="h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground">Expiração</Label>
                          <Input type="date" value={formData.coupon_expiry} onChange={(e) => handleInputChange("coupon_expiry", e.target.value)} className="h-11" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA 5: FORMULÁRIO --- */}
        <TabsContent value="form" className="mt-0 space-y-4 animate-in slide-in-from-right duration-300">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Personalizar Formulário</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-4 bg-muted/20 rounded-lg flex items-center gap-3 border border-border">
                <Info className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-card-foreground font-medium">Os campos <span className="underline">Nome Completo</span>, <span className="underline">E-mail</span> e <span className="underline">Telefone</span> já são coletados por padrão.</p>
              </div>
              
              {formData.custom_fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-end p-5 border rounded-2xl bg-white shadow-sm hover:border-[#007600]/30 transition-colors">
                  <div className="flex-1 w-full space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Pergunta / Rótulo</Label>
                    <Input 
                      placeholder="Ex: Qual seu grupo de oração?" 
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
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Resposta</Label>
                    <Select 
                      value={field.type}
                      onValueChange={(v: any) => {
                        const newFields = [...formData.custom_fields];
                        newFields[index].type = v;
                        handleInputChange("custom_fields", newFields);
                      }}
                    >
                      <SelectTrigger className="h-11 focus:ring-[#007600]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Campo de Texto</SelectItem>
                        <SelectItem value="select">Lista de Seleção</SelectItem>
                        <SelectItem value="checkbox">Caixa de Seleção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem("custom_fields", field.id)} className="h-11 w-11 text-destructive hover:bg-destructive/10 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" className="w-full h-14 border-dashed border-[#007600]/30 text-[#007600] hover:bg-[#007600]/5 font-bold" onClick={handleAddField}>
                <Plus className="w-5 h-5 mr-2" /> Adicionar Pergunta Personalizada
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ABA 6: MENSAGENS E TERMOS --- */}
        <TabsContent value="messages" className="mt-0 animate-in zoom-in duration-300">
          <Card className="border-none shadow-lg rounded-2xl overflow-hidden max-w-2xl mx-auto">
            <CardContent className="p-10 space-y-8 text-center">
              <div className="w-20 h-20 bg-[#007600]/10 rounded-full flex items-center justify-center mx-auto ring-8 ring-[#007600]/5">
                <CheckCircle2 className="w-10 h-10 text-[#007600]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Quase tudo pronto!</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Confira as informações nas abas anteriores. Ao finalizar, o evento será ativado e você poderá começar a compartilhar o link.
                </p>
              </div>

              <div className="h-px bg-border w-full" />

              <div className="flex items-start gap-3 text-left p-4 bg-muted/30 rounded-xl cursor-pointer group hover:bg-muted/50 transition-colors">
                <Checkbox 
                  id="terms" 
                  checked={formData.agreed_terms} 
                  onCheckedChange={(v: boolean) => handleInputChange("agreed_terms", v)}
                  className="mt-1 data-[state=checked]:bg-[#007600] data-[state=checked]:border-[#007600]"
                />
                <Label htmlFor="terms" className="text-sm font-medium leading-relaxed group-hover:text-foreground transition-colors cursor-pointer">
                  Concordo com os <a href="/terms" className="text-[#007600] underline font-bold" onClick={e => e.stopPropagation()}>termos de uso</a> e 
                  <a href="/privacy" className="text-[#007600] underline font-bold" onClick={e => e.stopPropagation()}> políticas de privacidade</a> da plataforma *
                </Label>
              </div>

              <Button 
                onClick={handleFinalize} 
                className="w-full h-14 text-lg font-black bg-[#007600] hover:bg-[#006000] shadow-xl shadow-[#007600]/20 transition-all active:scale-95 uppercase tracking-widest"
                disabled={!formData.name || !formData.agreed_terms}
              >
                Criar evento e continuar
              </Button>
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
          className="w-full sm:w-auto h-12 px-10 gap-2 font-bold bg-[#007600] hover:bg-[#006000] transition-colors shadow-lg" 
          onClick={handleSaveAndNext}
        >
          <Save className="w-5 h-5" /> 
          {activeTab === "messages" ? "FINALIZAR CRIAÇÃO" : "SALVAR E CONTINUAR"}
        </Button>
      </div>
    </div>
  );
};

export default EventCreatePage;
