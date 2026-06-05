import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePlatformSettings, useUpdatePlatformSetting } from "@/hooks/use-platform-settings";
import { useCreateAuditLog } from "@/hooks/use-audit-log";

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();
  const { data: settings } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  const createAuditLog = useCreateAuditLog();
  const [nomePlataforma, setNomePlataforma] = useState("Guardião Eventos");
  const [emailSuporte, setEmailSuporte] = useState("suporte@guardiao.app");
  const [taxaPlataforma, setTaxaPlataforma] = useState("5");
  const [mensagemBoasVindas, setMensagemBoasVindas] = useState(
    "Bem-vindo ao Guardião Eventos, a plataforma para gestão de eventos católicos.",
  );
  const [manutencao, setManutencao] = useState(false);
  const [novosCadastros, setNovosCadastros] = useState(true);
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Hidrata os campos a partir das chaves persistidas em platform_settings.
  useEffect(() => {
    const m = settings?.map;
    if (!m) return;
    if (m.taxa_plataforma_percent != null) setTaxaPlataforma(m.taxa_plataforma_percent);
    if (m.platform_name != null) setNomePlataforma(m.platform_name);
    if (m.support_email != null) setEmailSuporte(m.support_email);
    if (m.welcome_message != null) setMensagemBoasVindas(m.welcome_message);
    if (m.maintenance_mode != null) setManutencao(m.maintenance_mode === "true");
    if (m.allow_signups != null) setNovosCadastros(m.allow_signups === "true");
    if (m.auto_approve_events != null) setAprovacaoAutomatica(m.auto_approve_events === "true");
  }, [settings?.map]);

  const handleSave = async () => {
    setSavingGeneral(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "platform_name", value: nomePlataforma }),
        updateSetting.mutateAsync({ key: "support_email", value: emailSuporte }),
        updateSetting.mutateAsync({ key: "welcome_message", value: mensagemBoasVindas }),
        updateSetting.mutateAsync({ key: "maintenance_mode", value: String(manutencao) }),
        updateSetting.mutateAsync({ key: "allow_signups", value: String(novosCadastros) }),
        updateSetting.mutateAsync({ key: "auto_approve_events", value: String(aprovacaoAutomatica) }),
      ]);
      createAuditLog.mutate({
        action: "ALTERAR_CONFIGURACOES",
        entity_type: "platform_settings",
        entity_id: "configuracoes_gerais",
        details: {
          platform_name: nomePlataforma,
          support_email: emailSuporte,
          maintenance_mode: manutencao,
          allow_signups: novosCadastros,
          auto_approve_events: aprovacaoAutomatica,
        },
      });
      toast({ title: "Configurações salvas", description: "As alterações foram aplicadas." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveTaxa = async () => {
    const num = Number(taxaPlataforma);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      toast({ title: "Valor inválido", description: "Informe uma taxa entre 0 e 100.", variant: "destructive" });
      return;
    }
    const taxaAnterior = settings?.map?.taxa_plataforma_percent ?? "5";
    try {
      await updateSetting.mutateAsync({ key: "taxa_plataforma_percent", value: String(num) });
      createAuditLog.mutate({
        action: "ALTERAR_TAXA_PLATAFORMA",
        entity_type: "platform_settings",
        entity_id: "taxa_plataforma_percent",
        details: { taxa_anterior: taxaAnterior, taxa_nova: String(num) },
      });
      toast({ title: "Taxa atualizada", description: `Nova taxa da plataforma: ${num}%.` });
    } catch (e: any) {
      toast({ title: "Erro ao salvar taxa", description: e.message, variant: "destructive" });
    }
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
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail de suporte</Label>
              <Input value={emailSuporte} onChange={(e) => setEmailSuporte(e.target.value)} maxLength={254} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mensagem de boas-vindas</Label>
            <Textarea
              rows={3}
              value={mensagemBoasVindas}
              onChange={(e) => setMensagemBoasVindas(e.target.value)}
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">
            Configurações financeiras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Taxa da plataforma (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxaPlataforma}
                onChange={(e) => setTaxaPlataforma(e.target.value)}
                disabled={!isSuperAdmin}
              />
              <p className="text-xs text-slate-500">
                Cobrada do comprador sobre cada ingresso pago. Atual: {settings?.map?.taxa_plataforma_percent ?? "5"}%.
              </p>
            </div>
            <div>
              <Button
                onClick={handleSaveTaxa}
                disabled={!isSuperAdmin || updateSetting.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {updateSetting.isPending ? "Salvando..." : "Salvar taxa"}
              </Button>
            </div>
          </div>
          {!isSuperAdmin && (
            <p className="text-xs text-amber-600">Apenas superadmin pode alterar a taxa da plataforma.</p>
          )}
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
        <Button onClick={handleSave} disabled={savingGeneral} className="bg-emerald-600 hover:bg-emerald-700">
          {savingGeneral ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
