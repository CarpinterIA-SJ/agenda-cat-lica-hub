import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, Bold, Italic, Underline, Code, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Image as ImageIcon, Strikethrough, Link } from "lucide-react";
import { toast } from "sonner";

export const EventPageTab = () => {
  const [description, setDescription] = useState("");
  const [mobileImage, setMobileImage] = useState<string | null>(null);
  const [webImage, setWebImage] = useState<string | null>(null);
  const [cancelDays, setCancelDays] = useState("7");
  const [correctionDays, setCorrectionDays] = useState("24");
  const [correctionUnit, setCorrectionUnit] = useState("horas");
  const [maxParticipants, setMaxParticipants] = useState("20");
  const [maxParticipantsUnit, setMaxParticipantsUnit] = useState("horas");

  const handleSave = () => {
    toast.success("Configurações da página salvas com sucesso!");
  };

  const ToolbarButton = ({ children }: { children: React.ReactNode }) => (
    <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {children}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Descrição do evento */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-primary border-b-2 border-primary pb-1 inline-block">
            Descrição do evento
          </h3>
          <p className="text-sm text-muted-foreground">
            Esse é o texto descritivo que aparecerá na página do evento. Adicione aqui todas as informações importantes sobre o evento para o seu público.
          </p>

          {/* Rich text toolbar */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-0.5 p-2 border-b bg-muted/20 flex-wrap">
              <ToolbarButton><Bold className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><Italic className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><Underline className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><Strikethrough className="w-4 h-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton><Code className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><AlignLeft className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><AlignCenter className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><AlignRight className="w-4 h-4" /></ToolbarButton>
              <div className="w-px h-5 bg-border mx-1" />
              <ToolbarButton><List className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><ListOrdered className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><Link className="w-4 h-4" /></ToolbarButton>
              <ToolbarButton><ImageIcon className="w-4 h-4" /></ToolbarButton>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escreva a descrição do evento aqui..."
              className="border-0 rounded-none min-h-[200px] focus-visible:ring-0 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Imagens */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-primary border-b-2 border-primary pb-1 inline-block">
            Imagens
          </h3>

          {/* Mobile image */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Imagem de divulgação mobile</Label>
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 bg-muted/10">
              {mobileImage ? (
                <img src={mobileImage} alt="Mobile preview" className="max-h-40 rounded" />
              ) : (
                <>
                  <Button variant="outline" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Upload className="w-4 h-4" /> Selecionar imagem
                  </Button>
                  <p className="text-xs text-muted-foreground">Ou arraste e solte a imagem aqui</p>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Tamanho desejado: <strong>600px x 800px</strong></p>
              <p>Formato: <strong>JPG ou PNG com no máximo 5MB.</strong></p>
            </div>
          </div>

          {/* Web image */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Imagem de divulgação web</Label>
            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 bg-muted/10">
              {webImage ? (
                <img src={webImage} alt="Web preview" className="max-h-40 rounded" />
              ) : (
                <>
                  <Button variant="outline" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Upload className="w-4 h-4" /> Selecionar imagem
                  </Button>
                  <p className="text-xs text-muted-foreground">Ou arraste e solte a imagem aqui</p>
                </>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Tamanho desejado: <strong>1400px x 770px</strong></p>
              <p>Formato: <strong>JPG ou PNG com no máximo 5MB.</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Políticas do evento */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-primary border-b-2 border-primary pb-1 inline-block">
            Políticas do evento
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">Permitir solicitar cancelamento de pedido em até</span>
              <Input
                type="number"
                value={cancelDays}
                onChange={(e) => setCancelDays(e.target.value)}
                className="w-16 h-9 text-center"
              />
              <span className="text-sm">dias após a compra e no mínimo</span>
              <Input
                type="number"
                value={correctionDays}
                onChange={(e) => setCorrectionDays(e.target.value)}
                className="w-16 h-9 text-center"
              />
              <span className="text-sm">horas antes do início do evento.</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm">Permitir edição de participantes no máximo</span>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-16 h-9 text-center"
              />
              <span className="text-sm">horas antes do início do evento.</span>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Atenção!</p>
                <p className="text-xs text-muted-foreground">
                  De acordo com o Código de Defesa do Consumidor (CDC), Art. 49, em qualquer compra online, há o direito de cancelamento e reembolso em até 7 dias após o pagamento. Você pode definir um período maior, caso queira.
                </p>
              </div>
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 rounded p-2">
              Solicitações de cancelamento e reembolso que sejam realizadas diretamente na plataforma e dentro desse prazo de cancelamento definido de 7 dias, serão atendidas automaticamente. O valor a ser "reembolsado" será o valor total pago, descontando as taxas de serviço da plataforma.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 font-semibold px-8">
          Salvar
        </Button>
      </div>
    </div>
  );
};
