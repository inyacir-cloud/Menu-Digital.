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

/** Tarjeta compacta para secciones tipo cuadrícula (complementos, bebidas…) */
export function MenuItemCard({ item, qty, closed, onQuickAdd, onOpen, onDecrement }: Props) {
  const inCart = qty > 0;
  const off = item.unavailable === true;
  const thumb = resolveImage(item.image);

  return (
    <li
      className={cn(
        "flex flex-col justify-between gap-2 rounded-2xl bg-surface/70 p-3 ring-1 ring-ink/10 transition-shadow hover:shadow-md",
        inCart && "bg-mustard/15 ring-2 ring-mustard",
        off && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2.5">
        {thumb && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Ver ${item.name}`}
            className="h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink/10"
          >
            <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <button
              type="button"
              onClick={onOpen}
              className={cn(
                "text-left text-[0.95rem] font-semibold leading-snug text-ink transition hover:text-terracotta-deep sm:text-base",
                off && "line-through decoration-ink/40",
              )}
            >
              {item.name}
            </button>
            {item.badge && !off && <ItemBadge text={item.badge} className="shrink-0" />}
          </div>
          {item.description && <p className="mt-1 text-xs leading-snug text-ink/60">{item.description}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold tabular-nums text-ink sm:text-lg">{formatPrice(item.price)}</span>
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
