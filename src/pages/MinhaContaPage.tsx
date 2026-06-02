import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Pencil, Lock, AlertTriangle, Info, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MinhaContaPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useProfile();
  const [activeTab, setActiveTab] = useState("perfil");
  const [nameOpen, setNameOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");

  useEffect(() => {
    if (profile?.name) setNameValue(profile.name);
  }, [profile?.name]);

  const email = user?.email ?? "—";
  const displayName = profile?.name || "Sem nome";

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    try {
      await updateProfile({ name: nameValue.trim() });
      toast({ title: "Perfil atualizado", description: "Seu nome foi salvo." });
      setNameOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado", description: "Enviamos um link para redefinir sua senha." });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Minha conta</h1>
          <Button
            variant="outline"
            className="border-blue-600 text-blue-700 hover:bg-blue-50"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left - Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <span className="text-4xl text-muted-foreground">👤</span>
              </div>
              <p className="text-sm text-muted-foreground">{email}</p>

              <div className="w-full border-t pt-4 space-y-4 text-left">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{displayName}</p>
                    <button onClick={() => setNameOpen(true)} title="Editar nome">
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-blue-600" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{email}</p>
                </div>
              </div>

              <Button className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-0" onClick={handleChangePassword}>
                <Lock className="w-4 h-4 mr-2" />
                Alterar senha
              </Button>
            </CardContent>
          </Card>

          {/* Right - Tabs Content */}
          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b rounded-none w-full justify-start gap-4 h-auto p-0">
                <TabsTrigger
                  value="perfil"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none bg-transparent px-1 pb-2"
                >
                  Configurações de perfil
                </TabsTrigger>
                <TabsTrigger
                  value="taxas"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:shadow-none bg-transparent px-1 pb-2"
                >
                  Taxas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="mt-6 space-y-6">
                {/* Dados da organização */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Dados da organização</h2>
                  <div className="w-8 h-0.5 bg-blue-600 mb-4" />
                </div>

                {/* Alert */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Complete seu cadastro para liberar os repasses das suas vendas.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Para viabilizar o repasse das suas vendas de forma segura, é indispensável concluir o preenchimento dos dados cadastrais.
                      </p>
                    </div>
                    <Button variant="outline" className="shrink-0">
                      Completar cadastro
                    </Button>
                  </CardContent>
                </Card>

                {/* Contas de repasse */}
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-4">Contas de repasse</h2>
                  <Card className="border-blue-100 bg-blue-50/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Nenhuma conta de repasse cadastrada</p>
                      </div>
                      <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar conta
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="taxas" className="mt-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">Taxas da plataforma</h2>
                  <div className="w-8 h-0.5 bg-blue-600 mb-4" />
                </div>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Taxa de serviço (ingresso pago)</span>
                      <span className="text-sm font-medium">10% + R$ 1,00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Taxa de serviço (ingresso gratuito)</span>
                      <span className="text-sm font-medium">Gratuito</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Antecipação de repasse</span>
                      <span className="text-sm font-medium">3,5%</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar nome</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={nameValue} onChange={(e) => setNameValue(e.target.value)} placeholder="Seu nome" maxLength={100} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveName} disabled={!nameValue.trim() || isUpdating}>
              {isUpdating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhaContaPage;
