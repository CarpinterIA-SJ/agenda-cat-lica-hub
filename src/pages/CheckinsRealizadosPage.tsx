import { useState } from "react";
import { ExternalLink, Calendar, ChevronLeft, FileText, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CheckinsRealizadosPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticketType, setTicketType] = useState<string>("");
  const [accessPoint, setAccessPoint] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!ticketType || !accessPoint) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo de check-in e o ponto de acesso para gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Simulando tempo de geração de relatório
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsGenerating(false);
    toast({
      title: "Relatório gerado com sucesso!",
      description: "O download do PDF foi iniciado.",
      className: "bg-[#004d00] text-white",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold uppercase text-slate-900">
              FABRICIO CHRISTIAN DA SILVA CAVALCANTE
            </h1>
            <a href="#" className="text-muted-foreground hover:text-slate-900 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="w-4 h-4" />
            <span>21/10/2026 às 12:00 até 22/10/2026 às 18:00</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => navigate("/organizador/meus-eventos")}
          className="gap-2 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para os meus eventos
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-orange-800 text-sm md:text-base leading-relaxed max-w-[80%]">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para 
          solicitar repasses de seu evento. Em caso de dúvidas, acesse:{" "}
          <Link to="#" className="text-blue-600 font-medium hover:underline">
            Central de Ajuda
          </Link>
          .
        </p>
        <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shrink-0" onClick={() => navigate("/minha-conta")}>
          Atualizar dados
        </Button>
      </div>

      {/* Check-ins Filter Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Check-ins realizados</h2>
          <div className="h-1 w-16 bg-[#004d00] mb-4" />
          <p className="text-slate-600 font-medium">Selecione o check-in para gerar relatório</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Select: Tipo de check-in */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              <span className="text-red-500">*</span> Tipo de check-in:
            </label>
            <Select value={ticketType} onValueChange={setTicketType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="participant">Participante</SelectItem>
                <SelectItem value="vip">Camarote / VIP</SelectItem>
                <SelectItem value="staff">Staff / Organização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select: Ponto de acesso */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              <span className="text-red-500">*</span> Ponto de acesso:
            </label>
            <Select value={accessPoint} onValueChange={setAccessPoint}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os pontos</SelectItem>
                <SelectItem value="main_entrance">Entrada Principal</SelectItem>
                <SelectItem value="side_entrance">Entrada Lateral</SelectItem>
                <SelectItem value="backstage">Backstage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gerar Relatório Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="gap-2 bg-[#004d00] hover:bg-[#003300] text-white min-w-[200px]"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Gerar relatório
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckinsRealizadosPage;
