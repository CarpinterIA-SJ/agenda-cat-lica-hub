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
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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

const EventCreatePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  
  // Estado Global do Formulário
  const [formData, setFormData] = useState({
    // Geral
    name: "",
    type: "presencial", // presencial, online, hibrido
    is_free: false,
    has_coupon: false,
    organizer: "",
    support_whatsapp: "",
    start_date: "",
    end_date: "",
    location: "",
    custom_url: "",
    is_public: true,
    description: "",
    // Página
    cover_image: null as File | null,
    page_content: "",
    // Ingressos
    tickets: [] as Ticket[],
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
  });

  // Lógica para sincronizar ingressos gratuitos
  useEffect(() => {
    if (formData.is_free) {
      const freeTicket: Ticket = {
        id: "default-free",
        name: "Entrada Gratuita",
        price: 0,
        quantity: 100,
        sale_limit: "",
      };
      setFormData(prev => ({ ...prev, tickets: [freeTicket] }));
    }
  }, [formData.is_free]);

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
      if (!formData.name || !formData.organizer || !formData.start_date) {
        toast.error("Preencha os campos obrigatórios: Nome, Organizador e Data de Início.");
        return false;
      }
    }
    if (tab === "tickets") {
      if (formData.tickets.length === 0) {
        toast.error("Adicione pelo menos um ingresso.");
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
      toast.info("Esta é a última aba.");
    }
  };

  const handleFinalize = () => {
    if (!validateTab("general") || !validateTab("tickets")) {
      setActiveTab("general");
      return;
    }
    toast.success("Evento Finalizado e Ativado com Sucesso!", {
      description: "Seu evento já está disponível para inscrições.",
    });
    setTimeout(() => navigate("/events"), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Criar Novo Evento</h1>
          <p className="text-muted-foreground mt-0.5">Fluxo assistido de configuração</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="general">1. Informações</TabsTrigger>
          <TabsTrigger value="page">2. Página</TabsTrigger>
          <TabsTrigger value="tickets">3. Ingressos</TabsTrigger>
          <TabsTrigger value="payment">4. Pagamento</TabsTrigger>
          <TabsTrigger value="form">5. Formulário</TabsTrigger>
          <TabsTrigger value="messages">6. Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Nome do Evento *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Retiro de Quaresma 2026" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organizador *</Label>
                  <Select 
                    value={formData.organizer} 
                    onValueChange={(v) => handleInputChange("organizer", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione o organizador" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paroquia">Paróquia São José</SelectItem>
                      <SelectItem value="diocese">Diocese Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Qual o tipo do evento? *</Label>
                  <div className="flex gap-4">
                    <Button 
                      variant={!formData.is_free ? "default" : "outline"} 
                      className="flex-1"
                      onClick={() => handleInputChange("is_free", false)}
                    >Pago</Button>
                    <Button 
                      variant={formData.is_free ? "default" : "outline"} 
                      className="flex-1"
                      onClick={() => handleInputChange("is_free", true)}
                    >Gratuito</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <Label>Ativar Cupom de Desconto?</Label>
                    <p className="text-[10px] text-muted-foreground">Permite códigos promocionais na compra</p>
                  </div>
                  <Switch 
                    checked={formData.has_coupon} 
                    onCheckedChange={(v) => handleInputChange("has_coupon", v)}
                    disabled={formData.is_free}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Input type="datetime-local" value={formData.start_date} onChange={(e) => handleInputChange("start_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input type="datetime-local" value={formData.end_date} onChange={(e) => handleInputChange("end_date", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço / Localização</Label>
                <Input placeholder="Digite o local ou link do maps" value={formData.location} onChange={(e) => handleInputChange("location", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="page" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Página do Evento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Conteúdo da Página</Label>
                <Textarea 
                  placeholder="Informações detalhadas para os participantes..." 
                  rows={8} 
                  value={formData.page_content}
                  onChange={(e) => handleInputChange("page_content", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6 space-y-4">
          {formData.tickets.map((ticket, index) => (
            <Card key={ticket.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-sm">Ingresso #{index + 1}</h4>
                  {!formData.is_free && (
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem("tickets", ticket.id)} className="text-destructive h-8 px-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome</Label>
                    <Input 
                      disabled={formData.is_free} 
                      value={ticket.name} 
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].name = e.target.value;
                        handleInputChange("tickets", newTickets);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input 
                      type="number" 
                      disabled={formData.is_free} 
                      value={ticket.price}
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].price = parseFloat(e.target.value);
                        handleInputChange("tickets", newTickets);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantidade</Label>
                    <Input 
                      type="number" 
                      value={ticket.quantity}
                      onChange={(e) => {
                        const newTickets = [...formData.tickets];
                        newTickets[index].quantity = parseInt(e.target.value);
                        handleInputChange("tickets", newTickets);
                      }}
                    />
                  </div>
                </div>
                {formData.has_coupon && (
                  <p className="mt-3 text-[10px] text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Suporta cupons de desconto
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
          {!formData.is_free && (
            <Button variant="outline" className="w-full border-dashed" onClick={handleAddTicket}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Outro Tipo de Ingresso
            </Button>
          )}
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Configurações de Venda</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {formData.is_free ? (
                <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">Evento Gratuito</p>
                  <p className="text-sm text-muted-foreground">Os pagamentos são processados pela plataforma com valor R$ 0,00.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Instruções de Pix / Chave</Label>
                    <Input placeholder="Chave Pix" value={formData.pix_key} onChange={(e) => handleInputChange("pix_key", e.target.value)} />
                  </div>

                  {formData.has_coupon && (
                    <div className="p-4 border rounded-lg bg-green-50/50 space-y-4">
                      <h4 className="text-sm font-bold text-green-800">CUPOM DE DESCONTO ATIVO</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Código do Cupom</Label>
                          <Input value={formData.coupon_code} onChange={(e) => handleInputChange("coupon_code", e.target.value.toUpperCase())} placeholder="Ex: PASCOA20" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tipo de Desconto</Label>
                          <Select value={formData.discount_type} onValueChange={(v: any) => handleInputChange("discount_type", v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentual (%)</SelectItem>
                              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Valor do Desconto</Label>
                          <Input type="number" value={formData.discount_value} onChange={(e) => handleInputChange("discount_value", parseFloat(e.target.value))} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Expira em</Label>
                          <Input type="date" value={formData.coupon_expiry} onChange={(e) => handleInputChange("coupon_expiry", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle>Formulário de Inscrição</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground border-b pb-4">Campos automáticos: Nome Completo, E-mail, Telefone.</p>
              
              {formData.custom_fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end p-4 border rounded-lg bg-muted/10">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">Rótulo do Campo</Label>
                    <Input 
                      placeholder="Ex: Qual sua pastoral?" 
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...formData.custom_fields];
                        newFields[index].label = e.target.value;
                        handleInputChange("custom_fields", newFields);
                      }}
                    />
                  </div>
                  <div className="w-32 space-y-1.5">
                    <Label className="text-xs">Tipo</Label>
                    <Select 
                      value={field.type}
                      onValueChange={(v: any) => {
                        const newFields = [...formData.custom_fields];
                        newFields[index].type = v;
                        handleInputChange("custom_fields", newFields);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="select">Seleção</SelectItem>
                        <SelectItem value="checkbox">Multi-escolha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem("custom_fields", field.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <Button variant="outline" className="w-full border-dashed" onClick={handleAddField}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta Personalizada
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6 text-center py-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Tudo pronto!</h3>
              <p className="text-sm text-muted-foreground">
                Confira se todas as abas foram preenchidas corretamente antes de ativar o evento.
              </p>
              <Button onClick={handleFinalize} className="w-full gap-2 h-12 text-lg">
                Finalizar e Ativar Evento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6 border-t mt-10">
        <Button variant="outline" onClick={() => navigate("/events")}>Sair sem salvar</Button>
        <Button className="gap-2" onClick={handleSaveAndNext}>
          <Save className="w-4 h-4" /> 
          {activeTab === "messages" ? "Validar Tudo" : "Salvar e Continuar"}
        </Button>
      </div>
    </div>
  );
};

export default EventCreatePage;
