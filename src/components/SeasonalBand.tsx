import type { MenuCategory, MenuItem } from "../types";
import { MenuItemRow } from "./MenuItemRow";
import { HelpIcon, LeafIcon } from "./icons";

interface Props {
  /** Categoría sintética construida desde la sección de temporada */
  category: MenuCategory;
  qtyOf: (itemId: string) => number;
  closed?: boolean;
  onQuickAdd: (item: MenuItem, category: MenuCategory) => void;
  onOpen: (item: MenuItem, category: MenuCategory) => void;
  onDecrement: (itemId: string) => void;
}

/**
 * Sección destacada de productos de temporada.
 * No es una categoría: solo existe cuando el administrador la activa
 * y se muestra al final del menú, después de todas las categorías.
 */
export function SeasonalBand({ category, qtyOf, closed, onQuickAdd, onOpen, onDecrement }: Props) {
  return (
    <section id={category.id} className="scroll-mt-24" aria-labelledby={`${category.id}-title`}>
      <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-dashed border-terracotta/50 bg-mustard/10 px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-terracotta text-white shadow-sm">
            <LeafIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id={`${category.id}-title`}
              className="text-[1.9rem] font-bold tracking-tight text-ink sm:text-4xl"
            >
              {category.title}
            </h2>
            <span className="mt-1 block h-1 w-10 rounded-full bg-terracotta" aria-hidden="true" />
          </div>
          {category.description && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-terracotta/40 bg-surface/70 px-3 py-1.5 text-xs font-semibold text-ink/80">
              <HelpIcon className="h-3.5 w-3.5 shrink-0 text-terracotta" />
              {category.description}
            </span>
          )}
        </header>

        <ul className="mt-3 space-y-0.5 sm:pl-2">
          {category.items.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              qty={qtyOf(item.id)}
              closed={closed}
              onQuickAdd={() => onQuickAdd(item, category)}
              onOpen={() => onOpen(item, category)}
              onDecrement={() => onDecrement(item.id)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
