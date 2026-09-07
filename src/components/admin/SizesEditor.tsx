import type { SizeOption } from "../../types";
import { uid } from "../../utils/id";
import { PlusIcon, TrashIcon } from "../icons";
import { Button, IconBtn, TextInput } from "./ui";

interface Props {
  label: string;
  value: SizeOption[];
  onChange: (next: SizeOption[]) => void;
  hint?: string;
}

/** Lista editable de tamaños / presentaciones con precio propio */
export function SizesEditor({ label, value, onChange, hint }: Props) {
  const update = (id: string, patch: Partial<SizeOption>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => onChange(value.filter((s) => s.id !== id));
  const add = () => onChange([...value, { id: uid("size"), name: "", price: 0 }]);

  return (
    <div>
      <span className="text-xs font-semibold text-ink/70">{label}</span>

      {value.length > 0 && (
        <ul className="mt-1 space-y-1.5">
          {value.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
              <TextInput
                value={s.name}
                onChange={(ev) => update(s.id, { name: ev.target.value })}
                placeholder="Ej. Medio litro"
                aria-label={`Nombre del tamaño ${i + 1}`}
                autoFocus={s.name === ""}
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/50">
                  $
                </span>
                <TextInput
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={s.price}
                  onChange={(ev) => update(s.id, { price: Math.max(0, Number(ev.target.value) || 0) })}
                  aria-label={`Precio del tamaño ${i + 1}`}
                  className="pl-7"
                />
              </div>
              <IconBtn label="Quitar tamaño" danger onClick={() => remove(s.id)}>
                <TrashIcon />
              </IconBtn>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" size="sm" className="mt-2" onClick={add} icon={<PlusIcon className="h-3.5 w-3.5" />}>
        Agregar tamaño
      </Button>
      {hint && <p className="mt-1 text-[0.7rem] leading-snug text-ink/50">{hint}</p>}
    </div>
  );
}
