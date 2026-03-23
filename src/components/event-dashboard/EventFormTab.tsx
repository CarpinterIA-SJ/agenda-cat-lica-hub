import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  isDefault: boolean;
}

const defaultFields: FormField[] = [
  { id: "name", label: "Nome completo:", placeholder: "", required: true, enabled: true, isDefault: true },
  { id: "email", label: "E-mail:", placeholder: "", required: true, enabled: false, isDefault: true },
  { id: "cpf", label: "CPF:", placeholder: "___.___.___-__", required: true, enabled: true, isDefault: true },
  { id: "birthdate", label: "Data de nascimento:", placeholder: "__/__/____", required: true, enabled: true, isDefault: true },
  { id: "phone", label: "Telefone (Whatsapp):", placeholder: "(__) _____-____", required: true, enabled: true, isDefault: true },
];

export const EventFormTab = () => {
  const [fields, setFields] = useState<FormField[]>(defaultFields);
  const [customFields, setCustomFields] = useState<FormField[]>([]);

  const toggleField = (id: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const addCustomField = () => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      label: "Novo campo:",
      placeholder: "",
      required: false,
      enabled: true,
      isDefault: false,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const updateCustomFieldLabel = (id: string, label: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label } : f))
    );
  };

  const handleSave = () => {
    toast.success("Campos customizados salvos com sucesso!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-bold text-foreground">Formulário de inscrição</h3>

          <div className="space-y-5">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-semibold text-primary">
                  {field.required && "* "}{field.label}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder={field.placeholder}
                    disabled
                    className="flex-1 bg-muted/20"
                  />
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                </div>
              </div>
            ))}

            {/* Custom fields */}
            {customFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={field.label}
                    onChange={(e) => updateCustomFieldLabel(field.id, e.target.value)}
                    className="text-sm font-semibold border-dashed max-w-xs"
                    placeholder="Nome do campo"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomField(field.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Input placeholder="" disabled className="flex-1 bg-muted/20" />
                  <Switch checked={field.enabled} />
                </div>
              </div>
            ))}
          </div>

          {/* Add field button */}
          <Button
            variant="outline"
            onClick={addCustomField}
            className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold"
          >
            <Plus className="w-4 h-4" /> Adicionar campo
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 font-semibold px-8">
          Salvar campos customizados
        </Button>
      </div>
    </div>
  );
};
