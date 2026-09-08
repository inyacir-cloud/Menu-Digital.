import type { Extra } from "../../types";
import { uid } from "../../utils/id";
import { QUICK_CHEESE_EXTRA, withQuickCheeseExtra } from "../../utils/menu";
import { PlusIcon, TrashIcon } from "../icons";
import { Button, IconBtn, TextInput } from "./ui";

interface Props {
  label: string;
  value: Extra[];
  onChange: (next: Extra[]) => void;
  hint?: string;
}

/** Lista editable de extras (nombre + precio adicional) */
export function ExtrasEditor({ label, value, onChange, hint }: Props) {
  const update = (id: string, patch: Partial<Extra>) =>
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));
  const add = () => onChange([...value, { id: uid("extra"), name: "", price: 0 }]);

  return (
    <div>
      <span className="text-xs font-semibold text-ink/70">{label}</span>

      {value.length > 0 && (
        <ul className="mt-1 space-y-1.5">
          {value.map((e, i) => (
            <li key={e.id} className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
              <TextInput
                value={e.name}
                onChange={(ev) => update(e.id, { name: ev.target.value })}
                placeholder="Ej. Con queso"
                aria-label={`Nombre del extra ${i + 1}`}
                autoFocus={e.name === ""}
              />
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/50">
                  +$
                </span>
                <TextInput
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={e.price}
                  onChange={(ev) => update(e.id, { price: Math.max(0, Number(ev.target.value) || 0) })}
                  aria-label={`Precio del extra ${i + 1}`}
                  className="pl-8"
                />
              </div>
              <IconBtn label="Quitar extra" danger onClick={() => remove(e.id)}>
                <TrashIcon />
              </IconBtn>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" size="sm" className="mt-2" onClick={add} icon={<PlusIcon className="h-3.5 w-3.5" />}>
        Agregar extra
      </Button>
      {!value.some((extra) => /con\s+queso/i.test(extra.name)) && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => onChange(withQuickCheeseExtra(value))}
          icon={<PlusIcon className="h-3.5 w-3.5" />}
        >
          {QUICK_CHEESE_EXTRA.name} ${QUICK_CHEESE_EXTRA.price}
        </Button>
      )}
      {hint && <p className="mt-1 text-[0.7rem] leading-snug text-ink/50">{hint}</p>}
    </div>
  );
}
