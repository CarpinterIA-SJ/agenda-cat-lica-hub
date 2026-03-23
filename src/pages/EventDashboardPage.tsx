import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Copy, 
  Download, 
  RefreshCw, 
  Users, 
  DollarSign, 
  ExternalLink,
  QrCode,
  Smartphone
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { toast } from "sonner";

const salesData = [
  { date: '10/03', index: 12 },
  { date: '11/03', index: 18 },
  { date: '12/03', index: 15 },
  { date: '13/03', index: 25 },
  { date: '14/03', index: 32 },
  { date: '15/03', index: 28 },
  { date: '16/03', index: 45 },
];

const EventDashboardPage = () => {
  const eventLink = "https://agendacatolica.com.br/event/retiro-quaresma-2026";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(eventLink);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Alert Card */}
      <Card className="bg-amber-50 border-amber-200 shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-amber-400">
        <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-amber-900">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <p className="font-bold text-sm">
              Atualize os seus dados cadastrais para não ter problemas no recebimento de seus repasses financeiros
            </p>
          </div>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-6 rounded-xl shrink-0 transition-all shadow-md shadow-amber-600/20 border-none">
            Atualizar dados
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Event Details Section */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-slate-900">Detalhes do Evento</CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 font-bold rounded-lg uppercase tracking-wider text-[10px] flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Publicado
                  </Badge>
                  <Badge variant="outline" className="text-slate-500 border-slate-200 px-3 py-1 font-bold rounded-lg uppercase tracking-wider text-[10px]">
                    Visível
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Link de compartilhamento</label>
                    <div className="flex gap-2">
                      <div className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center text-sm font-medium text-slate-600 truncate">
                        {eventLink}
                      </div>
                      <Button variant="outline" size="icon" onClick={handleCopyLink} className="h-11 w-11 rounded-xl border-slate-200 hover:text-primary transition-all shrink-0">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 hover:text-primary transition-all shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">App de Check-in</h4>
                        <p className="text-xs font-medium text-slate-500 tracking-tight">Baixe agora para gerenciar as entradas</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="h-9 px-3 bg-slate-900 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform border border-slate-800">
                        <div className="w-4 h-4 bg-white/20 rounded-full" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">App Store</span>
                      </div>
                      <div className="h-9 px-3 bg-slate-900 rounded-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform border border-slate-800">
                        <div className="w-4 h-4 bg-white/20 rounded-full" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Google Play</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center space-y-6 bg-slate-50/30 rounded-3xl p-8 border border-slate-100 border-dashed">
                  <div className="p-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                  <Button variant="outline" className="w-full h-11 gap-2 font-bold border-slate-200 text-slate-600 hover:bg-white hover:border-primary hover:text-primary transition-all rounded-xl shadow-sm">
                    <Download className="w-4 h-4" /> Baixar QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales chart */}
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-lg font-bold text-slate-900">Evolução de Vendas</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="index" 
                      stroke="#1e73e8" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#1e73e8', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Performance Indicators & Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Performance Indicators */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-500">
              <div className="h-2 bg-primary group-hover:h-3 transition-all" />
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] text-primary bg-primary/5 uppercase font-bold border-primary/20">+12% hoje</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Participantes</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">1.240</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-500">
              <div className="h-2 bg-emerald-500 group-hover:h-3 transition-all" />
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 uppercase font-bold border-emerald-100">Pronto para saque</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disponível para Repasse</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">R$ 15.420,00</h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CRM Sync Card */}
          <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white border-t-4 border-t-primary">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                  <RefreshCw className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Sincronização com CRM</h4>
                  <p className="text-xs font-medium text-slate-500 tracking-tight leading-relaxed">Mantenha sua base de dados atualizada automaticamente</p>
                </div>
              </div>
              <Button className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 rounded-xl transition-all shadow-lg shadow-slate-900/10 border-none">
                <RefreshCw className="w-4 h-4" /> Sincronizar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDashboardPage;
