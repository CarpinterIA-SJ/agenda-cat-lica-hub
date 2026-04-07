import { useState } from "react";
import { ExternalLink, Calendar, Wallet, HandCoins, Clock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function FinanceiroRepassePage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase flex items-center gap-2 text-slate-900">
            FABRICIO CHRISTIAN DA SILVA CAVALCANTE
            <ExternalLink className="w-5 h-5 text-gray-500" />
          </h1>
          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Calendar className="w-5 h-5" />
            <span>21/10/2026 às 12:00 até 22/10/2026 às 18:00</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/organizador/dashboard")}
          className="whitespace-nowrap bg-white hover:bg-slate-50"
        >
          Voltar para os meus eventos
        </Button>
      </div>

      {/* Warning Banner */}
      <div className="bg-[#FFF5ED] border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-orange-800 text-sm flex-1">
          Atualize os seus dados cadastrais na Guardião Eventos. Esse cadastro é necessário para solicitar repasses de seu evento...
        </p>
        <Button className="bg-[#EA580C] hover:bg-[#C2410C] text-white">
          Atualizar dados
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total a receber</p>
            <p className="text-2xl font-bold">R$ 0,00</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#004d00]/10 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-[#004d00]" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total recebido</p>
            <p className="text-2xl font-bold">R$ 0,00</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aguardando liberação</p>
            <p className="text-2xl font-bold">R$ 0,00</p>
          </div>
        </div>
      </div>

      {/* Repasses Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Financeiro</p>
              <h2 className="text-xl font-bold text-gray-900">Repasses efetuados</h2>
              <div className="h-1 w-12 bg-[#004d00] mt-2 rounded-full"></div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="text-gray-400 border-gray-200"
                disabled
              >
                Solicitar antecipação
              </Button>
              <Button 
                className="bg-[#004d00] hover:bg-[#003300] text-white"
                onClick={() => setIsModalOpen(true)}
              >
                Solicitar repasse
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Pesquisar..." 
                className="pl-9 bg-gray-50 border-gray-200"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                <th className="p-4 font-bold text-gray-700">Solicitação</th>
                <th className="p-4 font-bold text-gray-700">Data da transferência</th>
                <th className="p-4 font-bold text-gray-700">Status</th>
                <th className="p-4 font-bold text-gray-700">Valor líquido</th>
                <th className="p-4 font-bold text-gray-700 whitespace-nowrap">Ver Comprovante</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-500 bg-gray-50/50">
                  Nenhum dado adicionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Exibindo 1 de 0 páginas</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8 pointer-events-none opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" className="w-8 h-8 bg-[#004d00] hover:bg-[#003300] text-white">
              1
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 pointer-events-none opacity-50">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal / Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#004d00]">Solicitar Repasse</DialogTitle>
            <DialogDescription>
              Confira seu saldo disponível e informe a conta para transferência.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">Saldo Disponível:</span>
              <span className="text-lg font-bold text-green-700">R$ 0,00</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Banco</label>
                <Input placeholder="Ex: 341 - Itaú" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Agência</label>
                  <Input placeholder="0000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Conta</label>
                  <Input placeholder="00000-0" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#004d00] hover:bg-[#003300] text-white" onClick={() => setIsModalOpen(false)}>
              Confirmar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
