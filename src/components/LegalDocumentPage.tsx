import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

interface LegalDocumentPageProps {
  title: string;
  content: string;
}

/**
 * Layout compartilhado pelas 3 páginas jurídicas (Termos, Privacidade,
 * Reembolso): mesma largura de leitura, mesmo tratamento de markdown/tabela,
 * mesmo rodapé. Cada página é só um título + o .md correspondente.
 */
export const LegalDocumentPage = ({ title, content }: LegalDocumentPageProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-slate-600 hover:text-primary"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">{title}</h1>
          <article
            className="prose prose-slate max-w-none
              prose-headings:font-bold prose-a:text-primary
              prose-table:border prose-table:border-slate-200
              prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-th:px-3 prose-th:py-2
              prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalDocumentPage;
