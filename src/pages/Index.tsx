import { Search, MapPin, Calendar, CheckCircle2, QrCode, HandCoins, Users, BarChart3, MessageCircle, Star } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="font-bold text-xl text-emerald-900">Guardião Eventos</div>
          <nav className="hidden md:flex gap-8 text-slate-700 font-medium">
            <a href="#eventos" className="hover:text-emerald-800">Eventos</a>
            <a href="#organizar" className="hover:text-emerald-800">Organizar</a>
            <a href="#dizimo" className="hover:text-emerald-800">Dízimo</a>
            <a href="#ajuda" className="hover:text-emerald-800">Ajuda</a>
          </nav>
          <Button className="bg-emerald-900 hover:bg-emerald-800 text-white">Acessar Painel</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-600 text-white">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">A Maior Plataforma de Eventos Cristãos do Brasil</h1>
            <p className="mt-4 text-lg text-emerald-50/90">
              Gestão completa para paróquias e comunidades: inscrições, check-in, dízimo digital e relatórios em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="bg-white text-emerald-900 hover:bg-emerald-50">Criar meu Evento</Button>
              <Button variant="outline" className="border-white/50 text-white hover:bg-white/10">Ver demonstração</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white/10 border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="bg-white rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop"
                  alt="Mockup do painel"
                  className="h-64 w-full object-cover"
                />
                <div className="p-4 text-emerald-900">
                  <div className="text-sm font-semibold">Dashboard Guardião Eventos</div>
                  <div className="text-xs text-slate-500">Acompanhe inscrições e check-ins em tempo real</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Bar */}
      <section className="bg-emerald-900 text-white">
        <div className="container mx-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Star className="h-5 w-5" />
            <span className="font-semibold">+15.000 Eventos Realizados</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Star className="h-5 w-5" />
            <span className="font-semibold">+2 Milhões de Ingressos</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Star className="h-5 w-5" />
            <span className="font-semibold">Líder em Gestão Eclesiástica</span>
          </div>
        </div>
      </section>

      {/* Search + Featured Events */}
      <section id="eventos" className="bg-slate-50">
        <div className="container mx-auto py-16">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder="Buscar eventos, paróquias ou cidades"
              />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">Eventos em Destaque</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="overflow-hidden">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop"
                    alt="Evento"
                    className="h-40 w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-900 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> 12 AGO
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Retiro de Lideranças 2026</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-600 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  São Paulo - SP
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white">Garantir Ingresso</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="organizar" className="bg-white">
        <div className="container mx-auto py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Gestão completa para sua Comunidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-800" />
              <span>Gestão de Inscrições</span>
            </div>
            <div className="flex items-center gap-3">
              <QrCode className="h-5 w-5 text-emerald-800" />
              <span>Check-in via QR Code</span>
            </div>
            <div id="dizimo" className="flex items-center gap-3">
              <HandCoins className="h-5 w-5 text-emerald-800" />
              <span>Dízimo Digital</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-emerald-800" />
              <span>CRM de Fiéis</span>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-emerald-800" />
              <span>Relatórios Financeiros</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-emerald-800" />
              <span>Suporte via WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Organizer App Module */}
      <section className="bg-slate-50">
        <div className="container mx-auto py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">App do Organizador</h3>
            <p className="mt-4 text-slate-600">
              Agilize a portaria dos seus eventos com check-in móvel, filas reduzidas e acompanhamento em tempo real.
            </p>
            <Button className="mt-6 bg-emerald-900 hover:bg-emerald-800 text-white">Conhecer o App</Button>
          </div>
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop"
              alt="App organizador"
              className="rounded-3xl shadow-xl w-full max-w-md object-cover"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="ajuda" className="bg-white">
        <div className="container mx-auto py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Depoimentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
                      alt="Pessoa"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">Pe. João Martins</div>
                      <div className="text-xs text-slate-500">Paróquia São José</div>
                    </div>
                  </div>
                  <p className="mt-4 text-slate-600 text-sm">
                    “Com o Guardião Eventos, nossa gestão ficou muito mais simples e os fiéis adoraram a experiência.”
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white">
        <div className="container mx-auto py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-bold text-lg">Guardião Eventos</div>
            <p className="text-emerald-100 text-sm mt-2">Plataforma completa para gestão de eventos cristãos.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Links rápidos</div>
            <ul className="space-y-1 text-emerald-100 text-sm">
              <li>Eventos</li>
              <li>Organizar</li>
              <li>Dízimo</li>
              <li>Ajuda</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Redes sociais</div>
            <ul className="space-y-1 text-emerald-100 text-sm">
              <li>Instagram</li>
              <li>Facebook</li>
              <li>YouTube</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-800 py-4 text-center text-sm text-emerald-100">
          © 2026 Guardião Eventos
        </div>
      </footer>
    </div>
  );
};

export default Index;
