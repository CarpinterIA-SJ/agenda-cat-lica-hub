import { useState } from "react";
import {
  Calendar, ChevronLeft, Search,
  Trash2, Loader2,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEvent } from "@/hooks/use-events";
import {
  useCheckinTypes,
  useCreateCheckinType,
  useDeleteCheckinType,
} from "@/hooks/use-checkins";

const CheckinsTiposPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { data: event } = useEvent(id);
  const { data: tipos = [], isLoading } = useCheckinTypes(id);
  const createTipo = useCreateCheckinType();
  const deleteTipo = useDeleteCheckinType();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);

  const filtered = tipos.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSalvar = async () => {
    if (!nome.trim() || !id) return;
    if (!event?.organization_id) {
      toast({ title: "Evento não encontrado", description: "Não foi possível identificar a organização.", variant: "destructive" });
      return;
    }
    try {
      await createTipo.mutateAsync({
        organization_id: event.organization_id,
        event_id: id,
        name: nome.trim(),
        description: descricao.trim() || null,
        active: ativo,
      });
      setNome(""); setDescricao(""); setAtivo(true); setIsModalOpen(false);
      toast({ title: "Tipo de check-in criado!" });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleExcluir = async (tipoId: string) => {
    try {
      await deleteTipo.mutateAsync(tipoId);
      toast({ title: "Tipo removido." });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold uppercase text-slate-900">
              {event?.name ?? "Check-in"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <Calendar className="w-4 h-4" />
            <span>
              {event?.start_at ? new Date(event.start_at).toLocaleString("pt-BR") : "Data a definir"}
            </span>
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

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Check-in
            </span>
            <div className="mb-2">
              <h2 className="text-xl font-bold text-slate-900">Tipos de check-in</h2>
            </div>
            <div className="h-1 w-16 bg-[#004d00]" />
          </div>
          <Button
            className="bg-[#004d00] hover:bg-[#003300] text-white"
            onClick={() => setIsModalOpen(true)}
          >
            + Adicionar
          </Button>
        </div>

        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} maxLength={100} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Nome</th>
                  <th className="px-4 py-3 text-left font-bold">Descrição</th>
                  <th className="px-4 py-3 text-left font-bold">Status</th>
                  <th className="px-4 py-3 text-center font-bold w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin inline" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                      Nenhum tipo de check-in cadastrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-slate-600">{t.description ?? "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={t.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                          {t.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleExcluir(t.id)} className="p-1 rounded-md hover:bg-red-50 text-red-500 transition-colors" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">Adicionar Tipo de Check-in</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-700 font-semibold">Nome do Tipo <span className="text-red-500">*</span></Label>
              <Input id="nome" placeholder="Ex: Entrada Principal" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-slate-700 font-semibold">Descrição</Label>
              <Input id="descricao" placeholder="Opcional" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4 mt-2">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold text-slate-800">Status Ativo</Label>
                <p className="text-sm text-slate-500">Define se este tipo de check-in está liberado para uso imediato.</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} className="data-[state=checked]:bg-[#004d00]" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-[#004d00] hover:bg-[#003300] text-white" disabled={!nome.trim() || createTipo.isPending} onClick={handleSalvar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckinsTiposPage;
