import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [nomePlataforma, setNomePlataforma] = useState("Guardião Eventos");
  const [emailSuporte, setEmailSuporte] = useState("suporte@guardiao.app");
  const [taxaPlataforma, setTaxaPlataforma] = useState("5.0");
  const [mensagemBoasVindas, setMensagemBoasVindas] = useState(
    "Bem-vindo ao Guardião Eventos, a plataforma para gestão de eventos católicos.",
  );
  const [manutencao, setManutencao] = useState(false);
  const [novosCadastros, setNovosCadastros] = useState(true);
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);

  const handleSave = () => {
    toast({ title: "Configurações salvas", description: "As alterações foram aplicadas." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ajustes globais da plataforma Guardião Eventos.
        </p>
      </div>

      <Card className="border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome da plataforma</Label>
              <Input
                value={nomePlataforma}
                onChange={(e) => setNomePlataforma(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail de suporte</Label>
              <Input value={emailSuporte} onChange={(e) => setEmailSuporte(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Taxa da plataforma (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={taxaPlataforma}
                onChange={(e) => setTaxaPlataforma(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem de boas-vindas</Label>
            <Textarea
              rows={3}
              value={mensagemBoasVindas}
              onChange={(e) => setMensagemBoasVindas(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Controles operacionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Modo manutenção</p>
              <p className="text-sm text-slate-500">
                Impede novos logins e exibe mensagem de manutenção.
              </p>
            </div>
            <Switch checked={manutencao} onCheckedChange={setManutencao} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Permitir novos cadastros</p>
              <p className="text-sm text-slate-500">
                Libera o registro de novos organizadores e participantes.
              </p>
            </div>
            <Switch checked={novosCadastros} onCheckedChange={setNovosCadastros} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Aprovação automática de eventos</p>
              <p className="text-sm text-slate-500">
                Eventos entram no ar sem revisão manual do administrador.
              </p>
            </div>
            <Switch
              checked={aprovacaoAutomatica}
              onCheckedChange={setAprovacaoAutomatica}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
