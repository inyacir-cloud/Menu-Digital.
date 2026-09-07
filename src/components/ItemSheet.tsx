import { useEffect, useMemo, useRef, useState } from "react";
import type { Extra, MenuCategory, MenuItem, SizeOption } from "../types";
import { resolveImage } from "../data/menu";
import { availableExtras, availableSizes } from "../utils/menu";
import { formatPrice } from "../utils/format";
import { cn } from "../utils/cn";
import { CheckIcon, CloseIcon, MinusIcon, PlusIcon } from "./icons";
import { ItemBadge } from "./ItemBadge";

export interface SheetSelection {
  qty: number;
  extras: Extra[];
  note: string;
  size?: SizeOption;
}

interface Props {
  item: MenuItem;
  category: MenuCategory;
  /** Negocio cerrado: se puede ver pero no agregar */
  closed?: boolean;
  onClose: () => void;
  onAdd: (selection: SheetSelection) => void;
}

/** Hoja "Agregar al pedido": tamaño, extras, cantidad y nota para la cocina */
export function ItemSheet({ item, category, closed, onClose, onAdd }: Props) {
  const extras = useMemo(() => availableExtras(item), [item]);
  // Solo se ofrecen los tamaños encendidos hoy
  const sizes = useMemo(() => availableSizes(item), [item]);
  const hasSizes = (item.sizes?.length ?? 0) > 0;
  const [qty, setQty] = useState(1);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [note, setNote] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  const image =
    resolveImage(item.image) ?? (category.layout === "grid" ? undefined : resolveImage(category.image));
  const off = item.unavailable === true || (hasSizes && sizes.length === 0);
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0] ?? null;
  const selectedExtras = extras.filter((e) => selected.has(e.id));
  const unit = (size?.price ?? item.price) + selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total = unit * qty;

  // Bloquear scroll del fondo + cerrar con Escape
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div
        className="absolute inset-0 animate-fade bg-ink/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-paper-light text-ink shadow-2xl sm:max-w-md sm:animate-pop sm:rounded-3xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink shadow ring-1 ring-ink/10 transition hover:bg-surface"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {image && (
            <div className="h-44 w-full bg-surface sm:h-52">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="px-5 pb-4 pt-5">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-ink/50">
              {category.title}
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <h2 id="sheet-title" className="text-2xl font-extrabold leading-tight tracking-tight text-ink">
                {item.name}
              </h2>
              <span className="shrink-0 text-2xl font-extrabold tabular-nums text-ink">
                {formatPrice(size?.price ?? item.price)}
              </span>
            </div>
            {item.badge && !off && <ItemBadge text={item.badge} className="mt-2.5" />}
            {off && (
              <span className="mt-2.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-red-700">
                Agotado por hoy
              </span>
            )}
            {item.description && <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.description}</p>}

            {closed && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                🔒 Estamos cerrados por ahora: puedes ver los detalles, pero los pedidos se habilitan en
                cuanto abramos.
              </p>
            )}

            {sizes.length > 0 && (
              <section className="mt-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-bold text-ink">Tamaño</h3>
                  <span className="text-xs text-ink/50">Elige uno *</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sizes.map((s) => {
                    const on = size?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSizeId(s.id)}
                        aria-pressed={on}
                        className={cn(
                          "flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2.5 transition",
                          on
                            ? "border-ink bg-ink text-paper"
                            : "border-ink/15 bg-surface text-ink hover:border-ink/40",
                        )}
                      >
                        <span className="text-sm font-bold leading-tight">{s.name}</span>
                        <span
                          className={cn("text-sm font-bold tabular-nums", on ? "text-mustard" : "text-mustard-ink")}
                        >
                          {formatPrice(s.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {extras.length > 0 && (
              <section className="mt-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-bold text-ink">Extras</h3>
                  <span className="text-xs text-ink/50">Opcional</span>
                </div>
                <ul className="mt-2 divide-y divide-ink/8 overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/8">
                  {extras.map((e) => {
                    const on = selected.has(e.id);
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggle(e.id)}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-paper/60"
                        >
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition",
                              on ? "border-ink bg-ink text-paper" : "border-ink/30 bg-surface",
                            )}
                          >
                            {on && <CheckIcon className="h-3 w-3" />}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-ink">{e.name}</span>
                          <span className="text-sm font-bold tabular-nums text-mustard-ink">
                            +{formatPrice(e.price)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <label className="mt-5 block">
              <span className="text-sm font-bold text-ink">
                Nota para la cocina <span className="font-normal text-ink/50">(opcional)</span>
              </span>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                placeholder="Ej. sin hielo, con menos azúcar, bien dorado…"
                className="mt-1.5 w-full resize-none rounded-xl border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:ring-2 focus:ring-mustard/40"
              />
            </label>
          </div>
        </div>

        <footer className="flex items-center gap-3 border-t border-ink/10 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-1 rounded-full bg-ink p-1 text-paper">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Menos"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-paper/20 disabled:opacity-40"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label="Más"
              className="grid h-9 w-9 place-items-center rounded-full bg-mustard text-on-mustard transition hover:bg-mustard-deep"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={off || closed}
            onClick={() => onAdd({ qty, extras: selectedExtras, note, size: size ?? undefined })}
            className="flex flex-1 items-center justify-between gap-3 rounded-full bg-ink px-5 py-3 font-bold text-paper shadow-lg transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{closed ? "Cerrado por ahora" : off ? "No disponible" : "Agregar al pedido"}</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
