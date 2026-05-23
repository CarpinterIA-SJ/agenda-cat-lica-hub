import { useNavigate, useParams } from "react-router-dom";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Info,
  Globe,
  Ticket,
  CreditCard,
  ClipboardList,
  MessageSquare,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
  Pilcrow,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useToast } from "@/hooks/use-toast";

/* ──────────────── toolbar ──────────────── */
export const EditorToolbar = ({ editor }: { editor: ReturnType<typeof useEditor> }) => {
  if (!editor) return null;
  const btn = (active: boolean) =>
    `p-1.5 rounded transition ${active ? "bg-[#004d00]/10 text-[#004d00]" : "text-slate-500 hover:bg-slate-100"}`;
  return (
    <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}><Bold className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}><Italic className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))}><UnderlineIcon className="h-4 w-4" /></button>
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL do link:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={btn(editor.isActive("link"))}
      >
        <Link2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={btn(editor.isActive("paragraph"))}><Pilcrow className="h-4 w-4" /></button>
    </div>
  );
};

/* ──────────────── editor wrapper ──────────────── */
export const MessageEditor = ({
  defaultContent,
  placeholder,
}: {
  defaultContent: string;
  placeholder?: string;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Digite sua mensagem..." }),
    ],
    content: defaultContent,
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none px-4 py-3 min-h-[120px] focus:outline-none [&_span.template-var]:text-[#004d00] [&_span.template-var]:font-semibold" },
    },
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

/* ──────────────── card section ──────────────── */
export const MessageSection = ({
  title,
  infoBanner,
  defaultContent,
  placeholder,
}: {
  title: string;
  infoBanner?: string;
  defaultContent: string;
  placeholder?: string;
}) => (
  <Card className="rounded-2xl bg-white shadow-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-bold">{title}</CardTitle>
      <div className="h-0.5 w-16 rounded bg-[#004d00] mt-1" />
    </CardHeader>
    <CardContent className="space-y-3">
      {infoBanner && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <span>{infoBanner}</span>
        </div>
      )}
      <MessageEditor defaultContent={defaultContent} placeholder={placeholder} />
    </CardContent>
  </Card>
);

/* ──────────────── page ──────────────── */
const OrganizerEventMensagensPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const eventName = "FABRICIO CHRISTIAN DA SILVA CAVALCANTE";

  const tabs = [
    { label: "Informações gerais", icon: Info, route: `/organizador/evento/${id}/configuracoes` },
    { label: "Página do evento", icon: Globe, route: `/organizador/evento/${id}/configuracoes/pagina` },
    { label: "Ingressos", icon: Ticket, route: `/organizador/evento/${id}/ingressos` },
    { label: "Pagamento", icon: CreditCard, route: `/organizador/evento/${id}/configuracoes/pagamento` },
    { label: "Formulário de inscrição", icon: ClipboardList, route: `/organizador/evento/${id}/configuracoes/formulario` },
    { label: "Mensagens", icon: MessageSquare, active: true },
  ];

  const handleSave = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Mensagens salvas", description: "As configurações de mensagens foram atualizadas." });
    }, 600);
  }, [toast]);

  const whatsappConfirmacao = `<p>Olá <span class="template-var">{{nome}}</span>! Sua inscrição no evento <span class="template-var">{{nome_evento}}</span> foi realizada com sucesso.</p><p>Guarde este comprovante. Em caso de dúvidas, entre em contato conosco.</p><p>Equipe Guardião Eventos</p>`;
  const whatsappFilaEspera = `<p>Olá <span class="template-var">{{nome}}</span>! Você foi cadastrado(a) na fila de espera do evento <span class="template-var">{{nome_evento}}</span>.</p><p>Assim que uma vaga for liberada, entraremos em contato.</p><p>Equipe Guardião Eventos</p>`;
  const emailConfirmacao = `<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Sua inscrição no evento <span class="template-var">{{nome_evento}}</span> foi confirmada com sucesso!</p><p>Você receberá mais detalhes em breve.</p><p>Atenciosamente,<br/>Equipe Guardião Eventos</p>`;
  const emailFilaEspera = `<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Você foi adicionado(a) à fila de espera do evento <span class="template-var">{{nome_evento}}</span>.</p><p>Notificaremos assim que houver disponibilidade.</p><p>Equipe Guardião Eventos</p>`;
  const mensagemIngresso = `<p>Segue em anexo o comprovante de inscrição do participante <span class="template-var">{{nome}}</span> para o evento <span class="template-var">{{nome_evento}}</span>.</p>`;
  const recuperacaoPix = `<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Notamos que seu pagamento via PIX para o evento <span class="template-var">{{nome_evento}}</span> ainda não foi confirmado.</p><p>Complete o pagamento para garantir sua vaga.</p><p>Equipe Guardião Eventos</p>`;
  const recuperacaoBoleto = `<p>Olá <span class="template-var">{{nome}}</span>,</p><p>Seu boleto para o evento <span class="template-var">{{nome_evento}}</span> está pendente de pagamento.</p><p>Efetue o pagamento até a data de vencimento para garantir sua inscrição.</p><p>Equipe Guardião Eventos</p>`;

  return (
    <div className="min-h-[calc(100vh-4rem)] -m-6 p-6 bg-slate-100/70 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{eventName}</h1>
          <button onClick={() => navigate("/organizador/meus-eventos")} className="text-sm text-muted-foreground hover:text-[#004d00]">
            Meus eventos &gt; {eventName}
          </button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => navigate(`/organizador/evento/${id}/dashboard`)}>
            Voltar para o painel do evento
          </Button>
          <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-100" onClick={() => navigate("/organizador/meus-eventos")}>
            Meus eventos
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => tab.route && navigate(tab.route)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              tab.active ? "bg-emerald-50 text-[#004d00]" : "text-slate-500 hover:bg-slate-50 hover:text-[#004d00]"
            }`}
          >
            <tab.icon className={`h-4 w-4 ${tab.active ? "text-[#004d00]" : "text-slate-400"}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banner informativo geral */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <span>
          A API do WhatsApp pode apresentar instabilidades. Em caso de falha no envio pelo WhatsApp, as mensagens padrão serão enviadas automaticamente por e-mail para garantir a entrega.
        </span>
      </div>

      {/* Message sections */}
      <MessageSection
        title="Mensagem para confirmação de inscrição - WhatsApp"
        defaultContent={whatsappConfirmacao}
      />

      <MessageSection
        title="Mensagem enviada após cadastro em fila de espera - WhatsApp"
        infoBanner="Esta mensagem será enviada automaticamente quando um participante for adicionado à fila de espera via WhatsApp."
        defaultContent={whatsappFilaEspera}
      />

      <MessageSection
        title="Mensagem para confirmação de inscrição - E-mail"
        defaultContent={emailConfirmacao}
      />

      <MessageSection
        title="Mensagem enviada após cadastro em fila de espera - E-mail"
        defaultContent={emailFilaEspera}
      />

      <MessageSection
        title="Mensagem para o ingresso (Comprovante de inscrição em PDF)"
        defaultContent={mensagemIngresso}
      />

      <MessageSection
        title="Mensagem para recuperação de pedido pendente - PIX (não pago)"
        defaultContent={recuperacaoPix}
      />

      <MessageSection
        title="Mensagem para recuperação de pedido pendente - Boleto (não pago)"
        defaultContent={recuperacaoBoleto}
      />

      {/* Save */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#004d00] text-white hover:bg-[#003a00] px-8"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
};

export default OrganizerEventMensagensPage;
