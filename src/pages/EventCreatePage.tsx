import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";

const EventCreatePage = () => {
  const navigate = useNavigate();
  const [isPublic, setIsPublic] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Criar Novo Evento</h1>
          <p className="text-muted-foreground mt-0.5">Preencha as informações do evento</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="general">Informações Gerais</TabsTrigger>
          <TabsTrigger value="page">Página do Evento</TabsTrigger>
          <TabsTrigger value="tickets">Ingressos</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="form">Formulário</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Nome do Evento</Label>
                  <Input placeholder="Ex: Retiro de Quaresma 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Evento</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hibrido">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Organizador</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Selecione o organizador" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paroquia">Paróquia São José</SelectItem>
                      <SelectItem value="diocese">Diocese Central</SelectItem>
                      <SelectItem value="pastoral">Pastoral da Juventude</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp de Suporte</Label>
                  <Input placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Término</Label>
                  <Input type="datetime-local" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço (Google Maps)</Label>
                <Input placeholder="Digite o endereço completo" />
              </div>

              <div className="space-y-2">
                <Label>URL personalizada do evento</Label>
                <div className="flex items-center gap-0">
                  <span className="px-3 h-10 flex items-center bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                    agendacatolica.com/
                  </span>
                  <Input className="rounded-l-none" placeholder="meu-evento" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="text-sm font-medium text-card-foreground">Evento Público</p>
                  <p className="text-xs text-muted-foreground">Qualquer pessoa pode visualizar e se inscrever</p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva seu evento..." rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="page" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Página do Evento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Imagem de Capa</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <p className="text-sm">Arraste uma imagem ou clique para fazer upload</p>
                  <p className="text-xs mt-1">PNG, JPG até 5MB. Recomendado: 1920x1080</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Conteúdo da Página</Label>
                <Textarea placeholder="Conteúdo detalhado do evento..." rows={8} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Ingressos</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><Label>Nome do Ingresso</Label><Input placeholder="Ex: Ingresso Individual" /></div>
                <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" placeholder="0.00" /></div>
                <div className="space-y-2"><Label>Quantidade Disponível</Label><Input type="number" placeholder="100" /></div>
                <div className="space-y-2"><Label>Data Limite de Venda</Label><Input type="date" /></div>
              </div>
              <Button variant="outline" className="gap-2"><span>+ Adicionar Ingresso</span></Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Configurações de Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Chave PIX</Label><Input placeholder="Sua chave PIX" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Formulário de Inscrição</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">Campos padrão: Nome, E-mail, Telefone</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2"><Label>Campo Personalizado</Label><Input placeholder="Ex: Comunidade" /></div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Tipo do campo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="select">Seleção</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline">+ Adicionar Campo</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>Mensagens Automáticas</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Mensagem de Confirmação</Label>
                <Textarea placeholder="Mensagem enviada após inscrição..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem de Lembrete</Label>
                <Textarea placeholder="Mensagem enviada antes do evento..." rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => navigate("/events")}>Cancelar</Button>
        <Button className="gap-2"><Save className="w-4 h-4" />Salvar Evento</Button>
      </div>
    </div>
  );
};

export default EventCreatePage;
