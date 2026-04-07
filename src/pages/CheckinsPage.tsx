import { useState } from "react";
import { ExternalLink, Calendar, ChevronLeft, PlayCircle } from "lucide-react";
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

const CheckinsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticketType, setTicketType] = useState<string>("");
  const [accessPoint, setAccessPoint] = useState<string>("");

  const handleStartCheckin = () => {
    if (!ticketType || !accessPoint) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione o tipo e o ponto de acesso antes de iniciar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Check-in iniciado",
      description: "Redirecionando para a leitura de QR Code...",
      className: "bg-[#004d00] text-white",
    });
    // In a real flow, you would redirect to the QR Code reader page here
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
          onClick={() => navigate("/organizador/dashboard")}
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
        <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shrink-0">
          Atualizar dados
        </Button>
      </div>

      {/* Check-in Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Realizar check-in</h2>
          <div className="h-1 w-16 bg-[#004d00]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Select: Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              Selecione o tipo <span className="text-red-500">*</span>
            </label>
            <Select value={ticketType} onValueChange={setTicketType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="participant">Participante</SelectItem>
                <SelectItem value="vip">Camarote / VIP</SelectItem>
                <SelectItem value="staff">Staff / Organização</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select: Access Point */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
              Ponto de acesso <span className="text-red-500">*</span>
            </label>
            <Select value={accessPoint} onValueChange={setAccessPoint}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main_entrance">Entrada Principal</SelectItem>
                <SelectItem value="side_entrance">Entrada Lateral</SelectItem>
                <SelectItem value="backstage">Backstage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Button: Start Check-in */}
          <Button 
            onClick={handleStartCheckin}
            className="w-full gap-2 bg-[#004d00] hover:bg-[#003300] text-white"
          >
            <PlayCircle className="w-5 h-5" />
            Iniciar check-in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckinsPage;
