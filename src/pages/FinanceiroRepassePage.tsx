import { useState } from "react";
import { ExternalLink, Calendar, Wallet, HandCoins, Clock, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMyOrganization } from "@/hooks/use-organizations";
import { useCreateWithdrawalRequest, useMyWithdrawalRequests } from "@/hooks/use-withdrawal-requests";
import { WithdrawalStatus } from "@/integrations/supabase/types";

const STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  paid: "Pago",
  rejected: "Rejeitado",
};

const STATUS_BADGE: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinanceiroRepassePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: org } = useMyOrganization();
  const { data: requests, isLoading } = useMyWithdrawalRequests();
  const createWithdrawal = useCreateWithdrawalRequest();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [banco, setBanco] = useState("");
  const [agencia, setAgencia] = useState("");
  const [conta, setConta] = useState("");
  const [titular, setTitular] = useState("");

  const resetForm = () => {
    setValor("");
    setBanco("");
    setAgencia("");
    setConta("");
    setTitular("");
  };

  const handleSubmit = async () => {
    const amountCents = Math.round(parseFloat(valor.replace(/\./g, "").replace(",", ".")) * 100);
    if (!amountCents || amountCents <= 0 || Number.isNaN(amountCents)) {
      toast({ title: "Valor inválido", description: "Informe um valor maior que zero.", variant: "destructive" });
      return;
    }
    if (!org?.id) {
      toast({
        title: "Organização não encontrada",
        description: "Não foi possível identificar sua organização.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createWithdrawal.mutateAsync({
        organization_id: org.id,
        amount_cents: amountCents,
        bank_name: banco || null,
        bank_agency: agencia || null,
        bank_account: conta || null,
        bank_holder: titular || null,
      });
      toast({ title: "Solicitação enviada", description: "Seu repasse foi solicitado e está em análise." });
      resetForm();
      setIsModalOpen(false);
    } catch (e: any) {
      toast({
        title: "Erro ao solicitar repasse",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

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
        <Button className="bg-[#EA580C] hover:bg-[#C2410C] text-white" onClick={() => navigate("/minha-conta")}>
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
            <p className="text-2xl font-bold">
              {fmtBRL((requests ?? []).filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_cents, 0))}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aguardando liberação</p>
            <p className="text-2xl font-bold">
              {fmtBRL(
                (requests ?? [])
                  .filter((r) => r.status === "pending" || r.status === "approved")
                  .reduce((s, r) => s + r.amount_cents, 0),
              )}
            </p>
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
                maxLength={100}
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
              {isLoading && (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-gray-100">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="p-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              )}

              {!isLoading && (requests ?? []).map((r) => (
                <tr key={r.id} className="border-b border-gray-100 text-sm">
                  <td className="p-4 text-gray-700">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="p-4 text-gray-700">
                    {r.paid_at ? new Date(r.paid_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="p-4">
                    <Badge className={STATUS_BADGE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="p-4 font-semibold text-gray-900">{fmtBRL(r.amount_cents)}</td>
                  <td className="p-4 text-gray-400">—</td>
                </tr>
              ))}

              {!isLoading && (requests ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 bg-gray-50/50">
                    Nenhum dado adicionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{(requests ?? []).length} solicitaç{(requests ?? []).length === 1 ? "ão" : "ões"}</span>
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
      <Dialog
        open={isModalOpen}
        onOpenChange={(o) => {
          setIsModalOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#004d00]">Solicitar Repasse</DialogTitle>
            <DialogDescription>
              Informe o valor e a conta para transferência do repasse.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor a solicitar (R$)</label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                maxLength={10}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Banco</label>
                <Input placeholder="Ex: 341 - Itaú" value={banco} onChange={(e) => setBanco(e.target.value)} maxLength={50} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Agência</label>
                  <Input placeholder="0000" value={agencia} onChange={(e) => setAgencia(e.target.value)} maxLength={10} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Conta</label>
                  <Input placeholder="00000-0" value={conta} onChange={(e) => setConta(e.target.value)} maxLength={20} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Titular da conta</label>
                <Input placeholder="Nome do titular" value={titular} onChange={(e) => setTitular(e.target.value)} maxLength={100} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
            <Button
              className="bg-[#004d00] hover:bg-[#003300] text-white"
              disabled={createWithdrawal.isPending}
              onClick={handleSubmit}
            >
              {createWithdrawal.isPending ? "Enviando..." : "Confirmar Solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
