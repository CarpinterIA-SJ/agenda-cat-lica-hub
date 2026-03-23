import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const EventPaymentTab = () => {
  const [creditCard, setCreditCard] = useState(true);
  const [pix, setPix] = useState(true);
  const [boleto, setBoleto] = useState(true);
  const [pixDeadline, setPixDeadline] = useState("30");
  const [pixDeadlineUnit, setPixDeadlineUnit] = useState("minutes");
  const [boletoDeadline, setBoletoDeadline] = useState("2");
  const [autoCancelExpired, setAutoCancelExpired] = useState(true);

  const handleSave = () => {
    toast.success("Configurações de pagamento salvas com sucesso!");
  };

  return (
    <div className="space-y-8">
      {/* Formas de pagamento */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-foreground">Formas de pagamento disponíveis</h3>

          {/* Cartão de crédito */}
          <div className="flex items-center gap-3">
            <Switch checked={creditCard} onCheckedChange={setCreditCard} />
            <Label className="text-sm font-medium">Cartão de crédito</Label>
          </div>

          {/* PIX */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={pix} onCheckedChange={setPix} />
              <Label className="text-sm font-medium">Pix</Label>
            </div>
            {pix && (
              <div className="ml-12 flex items-center gap-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground">* Prazo para pagamento</Label>
                  <Input
                    type="number"
                    value={pixDeadline}
                    onChange={(e) => setPixDeadline(e.target.value)}
                    className="w-24 h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-foreground">* Prazo para pagamento</Label>
                  <Select value={pixDeadlineUnit} onValueChange={setPixDeadlineUnit}>
                    <SelectTrigger className="w-32 h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutos</SelectItem>
                      <SelectItem value="hours">Horas</SelectItem>
                      <SelectItem value="days">Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Boleto */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={boleto} onCheckedChange={setBoleto} />
              <Label className="text-sm font-medium">Boleto</Label>
            </div>
            {boleto && (
              <div className="ml-12 flex items-center gap-3">
                <div>
                  <Label className="text-xs font-semibold text-foreground">* Prazo para pagamento</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={boletoDeadline}
                      onChange={(e) => setBoletoDeadline(e.target.value)}
                      className="w-24 h-9"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">Como funciona os recebimentos:</p>
              <ul className="text-xs text-muted-foreground list-disc ml-4 space-y-1">
                <li>Você poderá sacar até 70% dos valores do evento, antes mesmo do evento acontecer. Pagamentos com PIX e Boleto ficam disponíveis para saque em até 2 dias após o pagamento, e pagamentos com Cartão de Crédito, em 30 dias.</li>
                <li>Em até 4 dias após a finalização do evento, 100% dos valores estarão disponíveis para saque.</li>
                <li>Disponibilizamos a opção de parcelamento em até 12x (com juros) para o participante (que arca com os juros do parcelamento), mas o evento recebe o valor integral dos ingressos em até 30 dias.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações gerais */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Configurações gerais</h3>
          <div className="flex items-center gap-3">
            <Switch checked={autoCancelExpired} onCheckedChange={setAutoCancelExpired} />
            <Label className="text-sm">Cancelar pedidos automaticamente após o prazo de pagamento expirado (conforme prazos acima)</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 font-semibold px-8">
          Salvar
        </Button>
      </div>
    </div>
  );
};
