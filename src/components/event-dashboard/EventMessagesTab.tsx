import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ToolbarButton = ({ children }: { children: React.ReactNode }) => (
  <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="flex items-center gap-1 p-2 border-b bg-muted/20">
      <ToolbarButton><Bold className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton><Italic className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton><Underline className="w-4 h-4" /></ToolbarButton>
      <ToolbarButton><Strikethrough className="w-4 h-4" /></ToolbarButton>
      <div className="w-px h-5 bg-border mx-1" />
      <Select defaultValue="paragraph">
        <SelectTrigger className="w-28 h-7 text-xs border-0 bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border-0 rounded-none min-h-[150px] focus-visible:ring-0 resize-none"
    />
  </div>
);

export const EventMessagesTab = () => {
  const [whatsappConfirmation, setWhatsappConfirmation] = useState(
    "Olá {{nome}} 😄!
Sua Inscrição foi realizada com sucesso para o evento {{nome_evento}}!
Verifique o arquivo em Anexo com os ingressos de entrada ao evento.
Em cada ingresso conterá um QR Code que será lido na entrada do evento para realização de check-in.
Atenciosamente,
Equipe Guardião Eventos"
  );
  const [whatsappWaitlist, setWhatsappWaitlist] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [emailWaitlist, setEmailWaitlist] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [pixRecovery, setPixRecovery] = useState("");
  const [boletoRecovery, setBoletoRecovery] = useState("");

  const handleSave = () => {
    toast.success("Mensagens salvas com sucesso!");
  };

  const InfoBanner = () => (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Os participantes sempre receberão notificações via Whatsapp, ao realizarem suas inscrições. Pode acontecer, em algumas situações de instabilidade da API do Whatsapp, em que essas mensagens personalizadas não sejam enviadas ao participante. Nesses casos, o sistema enviará uma mensagem padrão.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <InfoBanner />

      {/* WhatsApp - Confirmação */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem para confirmação de inscrição - Whatsapp
        </h3>
        <RichTextEditor value={whatsappConfirmation} onChange={setWhatsappConfirmation} />
      </div>

      {/* WhatsApp - Fila de espera */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem enviada após cadastro em fila de espera - Whatsapp
        </h3>
        <InfoBanner />
        <RichTextEditor value={whatsappWaitlist} onChange={setWhatsappWaitlist} />
      </div>

      {/* Email - Confirmação */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem para confirmação de inscrição - E-mail
        </h3>
        <RichTextEditor value={emailConfirmation} onChange={setEmailConfirmation} />
      </div>

      {/* Email - Fila de espera */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem enviada após cadastro em fila de espera - Email
        </h3>
        <RichTextEditor value={emailWaitlist} onChange={setEmailWaitlist} />
      </div>

      {/* Ticket message */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem para o ingresso (Comprovante de inscrição em PDF)
        </h3>
        <RichTextEditor value={ticketMessage} onChange={setTicketMessage} />
      </div>

      {/* PIX recovery */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem para recuperação de pedido pendente - PIX (não pago)
        </h3>
        <RichTextEditor value={pixRecovery} onChange={setPixRecovery} />
      </div>

      {/* Boleto recovery */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground border-b-2 border-primary pb-1 inline-block">
          Mensagem para recuperação de pedido pendente - Boleto (não pago)
        </h3>
        <RichTextEditor value={boletoRecovery} onChange={setBoletoRecovery} />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 font-semibold px-8">
          Salvar
        </Button>
      </div>
    </div>
  );
};
