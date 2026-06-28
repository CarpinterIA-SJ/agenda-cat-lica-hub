import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Lock, AlertTriangle, Info, Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useMyOrganization } from "@/hooks/use-organizations";
import { usePayoutAccounts, useCreatePayoutAccount, useDeletePayoutAccount } from "@/hooks/use-payout-accounts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Exibição mascarada de dados sensíveis (valor íntegro só no banco).
const maskTail = (v: string | null | undefined) => {
  const s = (v ?? "").trim();
  if (!s) return "—";
  return s.length <= 4 ? `•••• ${s}` : `•••• ${s.slice(-4)}`;
};
const maskDocument = (v: string | null | undefined) => {
  const digits = (v ?? "").replace(/\D/g, "");
  if (!digits) return "—";
  return `•••.•••.•••-${digits.slice(-2)}`;
};
const PIX_KEY_TYPE_LABEL: Record<string, string> = {
  cpf: "CPF", cnpj: "CNPJ", email: "E-mail", phone: "Telefone", random: "Aleatória",
};
const BANK_ACCOUNT_TYPE_LABEL: Record<string, string> = {
  corrente: "Corrente", poupanca: "Poupança",
};

const MinhaContaPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile, isUpdating } = useProfile();
  const { data: org } = useMyOrganization();
  const { data: payoutAccounts = [] } = usePayoutAccounts(org?.id);
  const createAccount = useCreatePayoutAccount();
  const deleteAccount = useDeletePayoutAccount();
  const [activeTab, setActiveTab] = useState("perfil");
  const [nameOpen, setNameOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Formulário de conta de repasse.
  const [accountOpen, setAccountOpen] = useState(false);
  const [accKind, setAccKind] = useState<"pix" | "bank">("pix");
  const [accLabel, setAccLabel] = useState("");
  const [accHolderName, setAccHolderName] = useState("");
  const [accHolderDoc, setAccHolderDoc] = useState("");
  const [accPixKeyType, setAccPixKeyType] = useState("");
  const [accPixKey, setAccPixKey] = useState("");
  const [accBankCode, setAccBankCode] = useState("");
  const [accBankName, setAccBankName] = useState("");
  const [accBankAgency, setAccBankAgency] = useState("");
  const [accBankAccount, setAccBankAccount] = useState("");
  const [accBankAccountType, setAccBankAccountType] = useState("");
  const [accIsDefault, setAccIsDefault] = useState(false);
  const [deleteAccId, setDeleteAccId] = useState<string | null>(null);

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

  const resetAccountForm = () => {
    setAccKind("pix"); setAccLabel(""); setAccHolderName(""); setAccHolderDoc("");
    setAccPixKeyType(""); setAccPixKey(""); setAccBankCode(""); setAccBankName("");
    setAccBankAgency(""); setAccBankAccount(""); setAccBankAccountType(""); setAccIsDefault(false);
  };

  const handleAddAccount = async () => {
    if (!org?.id) {
      toast({ title: "Organização não encontrada", description: "Cadastre sua organização primeiro.", variant: "destructive" });
      return;
    }
    if (!accHolderName.trim() || !accHolderDoc.trim()) {
      toast({ title: "Dados do titular obrigatórios", description: "Informe nome e CPF/CNPJ do titular.", variant: "destructive" });
      return;
    }
    if (accKind === "pix") {
      if (!accPixKeyType || !accPixKey.trim()) {
        toast({ title: "Dados do PIX obrigatórios", description: "Informe o tipo e a chave PIX.", variant: "destructive" });
        return;
      }
    } else if (!accBankCode.trim() || !accBankName.trim() || !accBankAgency.trim() || !accBankAccount.trim() || !accBankAccountType) {
      toast({ title: "Dados bancários obrigatórios", description: "Preencha código do banco, banco, agência, conta e tipo.", variant: "destructive" });
      return;
    }
    try {
      await createAccount.mutateAsync({
        organization_id: org.id,
        label: accLabel.trim() || null,
        account_kind: accKind,
        holder_name: accHolderName.trim(),
        holder_document: accHolderDoc.trim(),
        pix_key_type: accKind === "pix" ? (accPixKeyType as any) : null,
        pix_key: accKind === "pix" ? accPixKey.trim() : null,
        bank_code: accKind === "bank" ? accBankCode.trim() : null,
        bank_name: accKind === "bank" ? accBankName.trim() : null,
        bank_agency: accKind === "bank" ? accBankAgency.trim() : null,
        bank_account: accKind === "bank" ? accBankAccount.trim() : null,
        bank_account_type: accKind === "bank" ? (accBankAccountType as any) : null,
        is_default: accIsDefault,
      });
      resetAccountForm();
      setAccountOpen(false);
      toast({ title: "Conta adicionada", description: "Conta de repasse cadastrada com sucesso." });
    } catch (e: any) {
      toast({ title: "Erro ao adicionar conta", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccId) return;
    try {
      await deleteAccount.mutateAsync(deleteAccId);
      setDeleteAccId(null);
      toast({ title: "Conta removida" });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
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
                    <Button variant="outline" className="shrink-0" onClick={() => navigate("/organizadores")}>
                      Completar cadastro
                    </Button>
                  </CardContent>
                </Card>

                {/* Contas de repasse */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Contas de repasse</h2>
                    <Button
                      variant="outline"
                      className="text-blue-700 border-blue-200 hover:bg-blue-100"
                      onClick={() => { resetAccountForm(); setAccountOpen(true); }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar conta
                    </Button>
                  </div>

                  {payoutAccounts.length === 0 ? (
                    <Card className="border-blue-100 bg-blue-50/50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Info className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Nenhuma conta de repasse cadastrada</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {payoutAccounts.map((acc) => (
                        <Card key={acc.id} className="border-slate-200">
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-foreground">
                                  {acc.account_kind === "pix" ? "PIX" : "Conta bancária"}
                                </span>
                                {acc.label && <span className="text-xs text-muted-foreground">· {acc.label}</span>}
                                {acc.is_default && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Padrão</Badge>}
                              </div>
                              {acc.account_kind === "pix" ? (
                                <p className="text-sm text-muted-foreground">
                                  {PIX_KEY_TYPE_LABEL[acc.pix_key_type ?? ""] ?? "Chave"}: {maskTail(acc.pix_key)}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {acc.bank_name} ({acc.bank_code}) · Ag {acc.bank_agency} · Conta {maskTail(acc.bank_account)} · {BANK_ACCOUNT_TYPE_LABEL[acc.bank_account_type ?? ""] ?? ""}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {acc.holder_name} · {maskDocument(acc.holder_document)}
                              </p>
                            </div>
                            <button
                              onClick={() => setDeleteAccId(acc.id)}
                              className="text-slate-400 hover:text-destructive shrink-0"
                              title="Remover conta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
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

      {/* Adicionar conta de repasse */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar conta de repasse</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Tipo de conta</Label>
              <Select value={accKind} onValueChange={(v) => setAccKind(v as "pix" | "bank")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank">Conta bancária</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Apelido (opcional)</Label>
              <Input value={accLabel} onChange={(e) => setAccLabel(e.target.value)} placeholder="Ex: Conta principal" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label>Titular</Label>
              <Input value={accHolderName} onChange={(e) => setAccHolderName(e.target.value)} placeholder="Nome do titular" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ do titular</Label>
              <Input value={accHolderDoc} onChange={(e) => setAccHolderDoc(e.target.value)} placeholder="Somente números" maxLength={18} />
            </div>

            {accKind === "pix" ? (
              <>
                <div className="space-y-2">
                  <Label>Tipo de chave PIX</Label>
                  <Select value={accPixKeyType} onValueChange={setAccPixKeyType}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input value={accPixKey} onChange={(e) => setAccPixKey(e.target.value)} placeholder="Chave PIX" maxLength={140} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Código do banco</Label>
                  <Input value={accBankCode} onChange={(e) => setAccBankCode(e.target.value)} placeholder="Ex: 001, 260, 077" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input value={accBankName} onChange={(e) => setAccBankName(e.target.value)} placeholder="Nome do banco" maxLength={80} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input value={accBankAgency} onChange={(e) => setAccBankAgency(e.target.value)} placeholder="0000" maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input value={accBankAccount} onChange={(e) => setAccBankAccount(e.target.value)} placeholder="00000-0" maxLength={20} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de conta</Label>
                  <Select value={accBankAccountType} onValueChange={setAccBankAccountType}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <Checkbox checked={accIsDefault} onCheckedChange={(c) => setAccIsDefault(c === true)} />
              <span className="text-sm text-muted-foreground">Definir como conta padrão</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddAccount} disabled={createAccount.isPending}>
              {createAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar conta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar remoção */}
      <Dialog open={!!deleteAccId} onOpenChange={(o) => !o && setDeleteAccId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover conta de repasse?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteAccount.isPending}>
              {deleteAccount.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhaContaPage;
