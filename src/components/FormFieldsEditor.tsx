import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  CustomFormField, CustomFieldType, CUSTOM_FIELD_TYPE_LABEL, fieldHasOptions,
} from "@/lib/form-fields";

interface FormFieldsEditorProps {
  value: CustomFormField[];
  onChange: (fields: CustomFormField[]) => void;
}

/**
 * Construtor de campos personalizados do formulário de inscrição.
 * Compartilhado entre o wizard de criação e a edição do evento, para
 * manter ambas as superfícies idênticas. Suporta texto, múltipla
 * escolha (radio), caixas de seleção (checkbox) e lista suspensa (select).
 */
export const FormFieldsEditor = ({ value, onChange }: FormFieldsEditorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState<string[]>(["", ""]);

  const openAdd = () => {
    setEditId(null);
    setLabel("");
    setType("text");
    setOptions(["", ""]);
    setOpen(true);
  };

  const openEdit = (f: CustomFormField) => {
    setEditId(f.id);
    setLabel(f.label);
    setType(f.type);
    setOptions(fieldHasOptions(f.type) && f.options?.length ? [...f.options] : ["", ""]);
    setOpen(true);
  };

  const save = () => {
    if (!label.trim()) {
      toast({ title: "Informe o nome do campo", variant: "destructive" });
      return;
    }
    let cleanOptions: string[] | undefined;
    if (fieldHasOptions(type)) {
      cleanOptions = options.map((o) => o.trim()).filter(Boolean);
      if (cleanOptions.length < 2) {
        toast({ title: "Adicione ao menos 2 opções", variant: "destructive" });
        return;
      }
    }
    const field: CustomFormField = {
      id: editId ?? Date.now().toString(),
      label: label.trim(),
      type,
      required: true,
      options: cleanOptions,
    };
    onChange(editId ? value.map((f) => (f.id === editId ? field : f)) : [...value, field]);
    setOpen(false);
  };

  const remove = (id: string) => onChange(value.filter((f) => f.id !== id));

  return (
    <div className="space-y-3">
      {value.map((f) => (
        <div
          key={f.id}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1 sm:flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-700">{f.label}</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                {CUSTOM_FIELD_TYPE_LABEL[f.type]}
              </span>
            </div>
            {fieldHasOptions(f.type) && f.options?.length ? (
              <p className="text-xs text-slate-500">{f.options.join(" · ")}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openEdit(f)}
              className="text-slate-400 hover:text-emerald-700 transition"
              title="Editar campo"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(f.id)}
              className="text-slate-400 hover:text-red-500 transition"
              title="Remover campo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        className="w-fit border-emerald-100 bg-emerald-50 text-[#004d00] hover:bg-emerald-100"
        onClick={openAdd}
      >
        <Plus className="w-4 h-4 mr-2" /> Adicionar campo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar campo" : "Adicionar campo"}</DialogTitle>
            <DialogDescription>Configure o campo do formulário de inscrição.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Nome do campo</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Estará com crianças?"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo do campo</Label>
              <Select value={type} onValueChange={(v) => setType(v as CustomFieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="radio">Múltipla escolha (escolhe 1)</SelectItem>
                  <SelectItem value="checkbox">Caixas de seleção (marca várias)</SelectItem>
                  <SelectItem value="select">Lista suspensa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fieldHasOptions(type) && (
              <div className="space-y-2">
                <Label>Opções</Label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) =>
                          setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))
                        }
                        placeholder={`Opção ${i + 1}`}
                        maxLength={120}
                      />
                      <button
                        type="button"
                        onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-red-500 shrink-0 disabled:opacity-30"
                        disabled={options.length <= 2}
                        title="Remover opção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions((prev) => [...prev, ""])}
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar opção
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="bg-[#004d00] text-white hover:bg-[#003a00]" onClick={save}>
              {editId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormFieldsEditor;
