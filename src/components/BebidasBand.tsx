import type { MenuCategory, MenuItem } from "../types";
import { formatPrice } from "../utils/format";
import { availableSizes, isAvailable, shortSizeName } from "../utils/menu";
import { cn } from "../utils/cn";
import { CupIcon, HelpIcon, LockIcon } from "./icons";

interface Props {
  category: MenuCategory;
  qtyOf: (itemId: string) => number;
  closed?: boolean;
  onQuickAdd: (item: MenuItem, category: MenuCategory) => void;
  onOpen: (item: MenuItem, category: MenuCategory) => void;
  onDecrement: (itemId: string) => void;
}

/**
 * Sección de bebidas del día: cuadrícula compacta.
 * Las aguas de sabor ofrecen dos tamaños (medio litro / litro) que se
 * eligen en la hoja del producto; aquí solo se muestra el precio "desde".
 */
export function BebidasBand({ category, qtyOf, closed, onQuickAdd, onOpen, onDecrement }: Props) {
  const available = category.items.filter(isAvailable);
  if (available.length === 0) return null;

  return (
    <section id={category.id} className="scroll-mt-24" aria-labelledby={`${category.id}-title`}>
      <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-dashed border-wa/40 bg-wa/5 px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wa text-white shadow-sm">
            <CupIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={`${category.id}-title`}
              className="text-[1.9rem] font-bold tracking-tight text-ink sm:text-4xl"
            >
              {category.title}
            </h2>
            <span className="mt-1 block h-1 w-10 rounded-full bg-wa" aria-hidden="true" />
          </div>
          {category.description && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-wa/30 bg-surface/70 px-3 py-1.5 text-xs font-semibold text-ink/80">
              <HelpIcon className="h-3.5 w-3.5 shrink-0 text-wa" />
              {category.description}
            </span>
          )}
        </header>

        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {available.map((item) => {
            const qty = qtyOf(item.id);
            const availSizes = availableSizes(item);
            const hasSizes = availSizes.length > 0;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col justify-between gap-1.5 rounded-xl bg-surface/70 p-2.5 ring-1 ring-ink/8 transition-shadow hover:shadow-md",
                  qty > 0 && "ring-2 ring-mustard",
                )}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpen(item, category)}
                    className="block w-full truncate text-left text-[0.85rem] font-semibold text-ink transition hover:text-terracotta-deep sm:text-sm"
                  >
                    {item.name}
                  </button>
                  {hasSizes ? (
                    <p className="text-[0.68rem] font-medium text-wa-deep">
                      {availSizes.map((s) => `${shortSizeName(s.name)} ${formatPrice(s.price)}`).join(" / ")}
                    </p>
                  ) : (
                    item.description && <p className="text-[0.7rem] leading-snug text-ink/55">{item.description}</p>
                  )}
                </div>
                  <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-bold tabular-nums text-ink">
                    {hasSizes ? `Desde ${formatPrice(Math.min(...availSizes.map((s) => s.price)))}` : formatPrice(item.price)}
                  </span>
                  {closed ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-ink/5 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink/50">
                      <LockIcon className="h-3 w-3" />
                      Cerrado
                    </span>
                  ) : (
                  <div className="flex items-center gap-0.5 rounded-full bg-ink p-0.5 text-paper shadow-sm">
                    {qty > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onDecrement(item.id)}
                          aria-label={`Quitar uno de ${item.name}`}
                          className="grid h-6 w-6 place-items-center rounded-full transition hover:bg-white/20"
                        >
                          <span className="text-xs font-bold">−</span>
                        </button>
                        <span className="min-w-[1rem] text-center text-xs font-bold tabular-nums">{qty}</span>
                        <button
                          type="button"
                          onClick={() => onQuickAdd(item, category)}
                          aria-label={`Agregar otro ${item.name}`}
                          className="grid h-6 w-6 place-items-center rounded-full bg-mustard text-on-mustard transition hover:bg-mustard-deep"
                        >
                          <span className="text-xs font-bold">+</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onQuickAdd(item, category)}
                        aria-label={`Agregar ${item.name}`}
                        className="grid h-6 w-6 place-items-center rounded-full bg-mustard text-on-mustard transition hover:bg-mustard-deep"
                      >
                        <span className="text-xs font-bold">+</span>
                      </button>
                    )}
                  </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
