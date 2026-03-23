import { useParams, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Video, 
  ChevronRight, 
  MessageCircle, 
  ShieldCheck, 
  Headphones,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 212,
    hours: 12,
    minutes: 38,
    seconds: 51
  });

  // Simulando busca de dados do evento
  const event = {
    name: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE",
    dateStart: "21/10/2026 às 12:00",
    dateEnd: "22/10/2026 às 18:00",
    type: "Evento online",
    organizer: "FABRICIO CHRISTIAN DA SILVA CAVALCANTE",
    description: "Cancelamento de inscrições pagas. O cancelamento para pedidos que contém inscrições pagas serão aceitos até 7 dias após a data da compra, considerando que a solicitação seja submetida em até 24 horas antes do início do evento."
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Header Placeholder (as in print) */}
      <header className="bg-white border-b px-6 py-4 flex justify-end items-center gap-6">
        <button onClick={() => navigate(-1)} className="mr-auto flex items-center gap-2 text-slate-600 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <span className="text-primary font-medium cursor-pointer">Cadastre-se</span>
        <Button variant="default" className="bg-[#1e73e8] hover:bg-[#1a66cc] px-8 h-10 rounded-md font-semibold">Entrar</Button>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (Main Info) */}
          <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 p-8 space-y-12">
            <div className="space-y-6 text-[#1e293b]">
              <h1 className="text-3xl font-extrabold tracking-tight uppercase">{event.name}</h1>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{event.dateStart} até {event.dateEnd}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <Video className="w-5 h-5 text-primary" />
                  <span>{event.type}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#1e293b]">Políticas do evento</h2>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700">Cancelamento de inscrições pagas</h3>
                <p className="text-slate-500 leading-relaxed max-w-2xl">
                  {event.description}
                </p>
                <button className="text-primary font-bold flex items-center gap-1 hover:underline">
                  Saiba mais <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Widgets) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Countdown */}
            <Card className="border-slate-100 shadow-sm overflow-hidden rounded-xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { val: timeLeft.days, label: "DIAS" },
                    { val: timeLeft.hours, label: "HORAS" },
                    { val: timeLeft.minutes, label: "MINUTOS" },
                    { val: timeLeft.seconds, label: "SEGUNDOS" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <span className="text-2xl font-bold text-slate-700">{item.val}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider font-outfit">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Registration */}
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-white p-4 border-b">
                  <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    Inscrição
                  </h3>
                </div>
                <div className="p-8 text-center bg-slate-50/30">
                  <div className="border border-slate-200 rounded-xl p-8 bg-white min-h-[140px] flex items-center justify-center">
                    <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-[200px]">
                      Nenhum ingresso cadastrado entre em contato com um organizador.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organizer */}
            <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-white p-4 border-b">
                  <h3 className="text-lg font-bold text-[#1e293b] flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    Realização
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-lg bg-slate-500 flex items-center justify-center text-white text-xl font-bold font-outfit">
                      FC
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 leading-tight uppercase text-sm">{event.organizer}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">\sv\sv\s</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary font-bold rounded-xl">
                    Falar com o organizador
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Section (as in print) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-200">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800">Formas de pagamento</h4>
            <div className="flex flex-wrap gap-4 items-center grayscale opacity-80">
              {['visa', 'mastercard', 'elo', 'diners', 'amex', 'boleto', 'pix'].map(id => (
                <img key={id} src={`https://raw.githubusercontent.com/fabriciocavalcante/agenda-catolica/main/public/payment/${id}.svg`} alt={id} className="h-6" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
              {/* Fallback for missing images in internal dev */}
              <div className="flex gap-2 text-xs font-bold text-slate-400">
                <span>VISA</span> <span>MASTER</span> <span>ELO</span> <span>PIX</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800">Certificados</h4>
            <div className="flex items-center gap-3">
              <div className="bg-[#f0f9f1] px-4 py-2 rounded-lg border border-[#dcfce7] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#166534]" />
                <div className="text-left leading-none">
                  <p className="text-[10px] font-bold text-[#166534] tracking-tight">SITE 100% SEGURO</p>
                  <p className="text-[8px] text-[#166534]/70 font-medium">SEUS DADOS PROTEGIDOS</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800">Precisa de ajuda?</h4>
            <Card className="border-slate-200/60 bg-white">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Central de atendimento</p>
                  <p className="text-xs text-slate-400 font-medium hover:underline cursor-pointer">Tire suas dúvidas aqui</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating WhatsApp Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50">
        <MessageCircle className="w-10 h-10 fill-current" />
      </button>

      <footer className="bg-white py-12 px-6 text-center text-slate-400 text-sm font-medium">
        © {new Date().getFullYear()} Guardião Eventos - Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default EventDetailPage;
