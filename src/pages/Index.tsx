import { Calendar, Monitor, MessageCircle, PhoneCall } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto flex items-center justify-end gap-6 py-4">
          <a href="#" className="text-sm text-slate-600 hover:text-blue-600">
            Cadastre-se
          </a>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Entrar</Button>
        </div>
      </header>

      {/* Main Card */}
      <main className="container mx-auto py-10">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
              {/* Left Content */}
              <div>
                <h1 className="text-xl font-semibold tracking-wide">
                  FABRICIO CHRISTIAN DA SILVA CAVALCANTE
                </h1>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    21/10/2026 às 12:00 até 22/10/2026 às 18:00
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-blue-600" />
                    Evento online
                  </div>
                </div>
                <div className="my-8 h-px bg-slate-200" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Políticas do evento</h2>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Cancelamento de inscrições pagas
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      O cancelamento para pedidos que contêm inscrições pagas serão aceitos até 7 dias após a data da compra,
                      considerando que a solicitação seja submetida em até 24 horas antes do início do evento.
                    </p>
                    <button className="mt-3 text-sm text-blue-600 hover:underline">Saiba mais</button>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "DIAS", value: "207" },
                    { label: "HORAS", value: "13" },
                    { label: "MINUTOS", value: "43" },
                    { label: "SEGUNDOS", value: "15" },
                  ].map((item) => (
                    <div key={item.label} className="border border-slate-200 rounded-lg text-center py-3">
                      <div className="text-lg font-semibold text-slate-900">{item.value}</div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-semibold">Inscrição</h3>
                  </div>
                  <div className="mt-3 rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-600">
                    Nenhum ingresso cadastrado entre em contato com um organizador.
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 rounded-full bg-blue-600" />
                    <h3 className="text-sm font-semibold">Realização</h3>
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                    <div className="h-12 w-12 rounded-md bg-slate-700 text-white flex items-center justify-center font-semibold">
                      FC
                    </div>
                    <div>
                      <div className="text-sm font-semibold">FABRICIO CHRISTIAN DA SILVA CAVALCANTE</div>
                      <div className="text-xs text-slate-500">vsv\sv\s</div>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                    Falar com o organizador
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Info */}
      <section className="bg-white border-t border-slate-200">
        <div className="container mx-auto py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="font-semibold mb-3">Formas de pagamento</h4>
            <div className="flex flex-wrap gap-4 text-slate-500">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Elo</span>
              <span>Dinheiro</span>
              <span>Boleto</span>
              <span>Pix</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Certificados</h4>
            <div className="text-emerald-700 font-medium">🔒 SITE 100% SEGURO</div>
            <div className="text-xs text-slate-500">Seus dados protegidos</div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Precisa de ajuda?</h4>
            <div className="border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm font-semibold">Central de atendimento</div>
                <div className="text-xs text-slate-500">Tire suas dúvidas aqui</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Float */}
      <button className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center">
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Index;
