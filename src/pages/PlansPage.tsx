import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Users, Star, ArrowLeft, Calendar, QrCode, FileText, MessageCircle, BarChart3, Tag } from "lucide-react";

const FEATURES_FREE = [
  "Eventos ilimitados",
  "Formulário de inscrição personalizado",
  "Página do evento dedicada",
  "Relatórios completos (inscrições, check-ins)",
  "Entrega por e-mail e WhatsApp",
  "Check-in por QR code",
  "Todas as categorias católicas",
];

const FEATURES_PAID = [
  "Tudo do plano gratuito",
  "Venda de ingressos pagos",
  "Cupons de desconto",
  "Relatórios financeiros avançados",
  "Repasse automático",
  "Suporte prioritário",
];

const FEATURES_LARGE = [
  "Tudo do plano pago",
  "Gerente de conta dedicado",
  "Integrações personalizadas",
  "Preço negociado por volume",
  "Suporte por WhatsApp, e-mail e telefone",
];

const TOOLS = [
  { icon: FileText, title: "Formulários personalizados", desc: "Capture exatamente o que precisa de cada inscrito: diocese, paróquia, restrições, etc." },
  { icon: BarChart3, title: "Relatórios em tempo real", desc: "Vendas, inscrições e check-ins em dashboards atualizados ao vivo." },
  { icon: Tag, title: "Cupons de desconto", desc: "Crie códigos promocionais com valor fixo ou percentual para impulsionar inscrições." },
  { icon: MessageCircle, title: "WhatsApp e E-mail", desc: "Envie confirmações e ingressos diretamente pelo WhatsApp ou e-mail do participante." },
  { icon: QrCode, title: "Check-in por QR code", desc: "App mobile para credenciamento rápido com QR code e verificação manual." },
  { icon: Calendar, title: "Página pública do evento", desc: "URL única e otimizada para conversão, compartilhável em redes sociais." },
];

const PlansPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f6f8f6]">
      <header className="bg-white border-b border-[#dfe8df]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm font-semibold text-[#0b3d2e]">Guardião Eventos — Para Organizadores</span>
          </div>
          <Button className="bg-[#0b3d2e] text-white hover:bg-[#0a3225]" onClick={() => navigate("/login")}>
            Começar grátis
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2f5a47] bg-[#2f5a47]/10 px-3 py-1 rounded-full">
            Plataforma para eventos católicos
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0b3d2e] leading-tight">
            Gerencie seus eventos com simplicidade e profissionalismo
          </h1>
          <p className="text-lg text-[#4b6355]">
            Retiros, congressos, acampamentos, cursos e muito mais — tudo em um só lugar, com ferramentas feitas para a comunidade católica.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 bg-[#0b3d2e] text-white hover:bg-[#0a3225]" onClick={() => navigate("/login")}>
              Criar conta gratuita
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 border-[#0b3d2e] text-[#0b3d2e]" onClick={() => navigate("/participante/explorar")}>
              Ver eventos disponíveis
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "100%", label: "Gratuito para eventos sem cobrança" },
            { value: "7,3%", label: "Taxa por ingresso pago (tudo incluso)" },
            { value: "0", label: "Taxa de setup ou mensalidade" },
            { value: "∞", label: "Eventos e inscrições ilimitados" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white border border-[#dfe8df] p-6 text-center space-y-2">
              <p className="text-3xl font-bold text-[#0b3d2e]">{s.value}</p>
              <p className="text-sm text-[#4b6355]">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Plans */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-[#0b3d2e] text-center">Planos transparentes, sem surpresas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="border-[#dfe8df] bg-white">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0b3d2e]/10 flex items-center justify-center mb-3">
                  <Star className="w-5 h-5 text-[#0b3d2e]" />
                </div>
                <CardTitle className="text-[#0b3d2e]">Gratuito</CardTitle>
                <p className="text-3xl font-bold text-[#0b3d2e]">R$ 0</p>
                <p className="text-sm text-[#4b6355]">Para eventos sem cobrança de ingresso</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURES_FREE.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-[#4b6355]">
                    <Check className="w-4 h-4 text-[#0b3d2e] shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
                <Button className="w-full mt-4 bg-[#0b3d2e] text-white hover:bg-[#0a3225]" onClick={() => navigate("/login")}>
                  Começar grátis
                </Button>
              </CardContent>
            </Card>

            {/* Paid */}
            <Card className="border-[#0b3d2e] bg-[#0b3d2e] text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                Mais popular
              </div>
              <CardHeader className="pb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-white">Pago</CardTitle>
                <p className="text-3xl font-bold text-white">7,3%</p>
                <p className="text-sm text-white/70">por inscrição paga (sem mensalidade)</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURES_PAID.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-white/90">
                    <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
                <Button className="w-full mt-4 bg-white text-[#0b3d2e] hover:bg-white/90 font-semibold" onClick={() => navigate("/login")}>
                  Criar evento pago
                </Button>
              </CardContent>
            </Card>

            {/* Large */}
            <Card className="border-[#dfe8df] bg-white">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0b3d2e]/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-[#0b3d2e]" />
                </div>
                <CardTitle className="text-[#0b3d2e]">Grandes Eventos</CardTitle>
                <p className="text-3xl font-bold text-[#0b3d2e]">Sob consulta</p>
                <p className="text-sm text-[#4b6355]">Para 1.000+ participantes</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {FEATURES_LARGE.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-[#4b6355]">
                    <Check className="w-4 h-4 text-[#0b3d2e] shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 border-[#0b3d2e] text-[#0b3d2e] hover:bg-[#0b3d2e]/10"
                  onClick={() => window.open("https://wa.me/", "_blank")}>
                  Falar com nossa equipe
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tools */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-[#0b3d2e] text-center">Tudo que você precisa para organizar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((t) => (
              <div key={t.title} className="rounded-2xl bg-white border border-[#dfe8df] p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b3d2e]/10 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-[#0b3d2e]" />
                </div>
                <h3 className="font-semibold text-[#0b3d2e]">{t.title}</h3>
                <p className="text-sm text-[#4b6355]">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-[#0b3d2e] text-white p-12 text-center space-y-6">
          <h2 className="text-3xl font-bold">Pronto para começar?</h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Crie sua conta gratuitamente e comece a organizar seus eventos em minutos. Sem mensalidade, sem cartão de crédito.
          </p>
          <Button size="lg" className="h-12 px-10 bg-white text-[#0b3d2e] hover:bg-white/90 font-semibold" onClick={() => navigate("/login")}>
            Criar conta gratuita
          </Button>
        </section>
      </main>

      <footer className="border-t border-[#dfe8df] py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[#4b6355]">
          Guardião Eventos — Plataforma para a comunidade católica
        </div>
      </footer>
    </div>
  );
};

export default PlansPage;
