import type { MenuItem } from "../types";
import { resolveImage } from "../data/menu";
import { formatPrice } from "../utils/format";
import { cn } from "../utils/cn";
import { ItemBadge } from "./ItemBadge";
import { ItemControl } from "./ItemControl";

interface Props {
  item: MenuItem;
  qty: number;
  closed?: boolean;
  onQuickAdd: () => void;
  onOpen: () => void;
  onDecrement: () => void;
}

/** Fila de producto en las secciones tipo lista (platillos) */
export function MenuItemRow({ item, qty, closed, onQuickAdd, onOpen, onDecrement }: Props) {
  const inCart = qty > 0;
  const off = item.unavailable === true;
  const thumb = resolveImage(item.image);
  const ownExtras = item.extras ?? [];

  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 rounded-xl py-1.5 pr-1 transition-colors sm:gap-x-3",
        inCart && "bg-mustard/15",
        off && "opacity-60",
      )}
    >
      {/* Viñeta o miniatura */}
      {thumb ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ver ${item.name}`}
          className="ml-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink/10 sm:h-12 sm:w-12"
        >
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
        </button>
      ) : (
        <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-ink sm:ml-2" aria-hidden="true" />
      )}

      {/* Nombre, etiqueta, línea punteada y descripción */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "min-w-0 text-left text-[1.05rem] leading-snug text-ink transition hover:text-terracotta-deep sm:text-lg md:text-xl",
              inCart && "font-semibold",
              off && "line-through decoration-ink/40",
            )}
          >
            {item.name}
          </button>
          {item.badge && !off && <ItemBadge text={item.badge} className="shrink-0" />}
          <span
            aria-hidden="true"
            className="mb-[0.35em] hidden min-w-4 flex-1 self-end border-b-2 border-dotted border-ink/25 sm:block"
          />
        </div>
        {item.description && (
          <p className="mt-1 text-[0.8rem] leading-snug text-ink/60 sm:text-sm">{item.description}</p>
        )}
        {ownExtras.length > 0 && !off && (
          <p className="mt-0.5 text-[0.7rem] font-semibold text-mustard-ink">
            Extras: {ownExtras.map((e) => (e.price > 0 ? `${e.name} +${formatPrice(e.price)}` : e.name)).join(" · ")}
          </p>
        )}
      </div>

      {/* Precio */}
      <span className="text-[1.05rem] font-semibold tabular-nums text-ink sm:text-lg md:text-xl">
        {formatPrice(item.price)}
      </span>

      {/* Agregar / cantidad */}
      <div className="flex w-[5.75rem] justify-end sm:w-[6.25rem]">
        <ItemControl
          name={item.name}
          qty={qty}
          unavailable={off}
          closed={closed}
          onAdd={onQuickAdd}
          onDecrement={onDecrement}
        />
      </div>
    </li>
  );
}
