import termosContent from "@/content/termos.md?raw";
import { LegalDocumentPage } from "@/components/LegalDocumentPage";

const TermosPage = () => <LegalDocumentPage title="Termos de Uso" content={termosContent} />;

export default TermosPage;
