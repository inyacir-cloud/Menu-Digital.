import { formatPrice } from "../utils/format";
import { BagIcon } from "./icons";

interface Props {
  count: number;
  total: number;
  onOpen: () => void;
}

export function CartButton({ count, total, onOpen }: Props) {
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:pr-6">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-full bg-ink py-2 pl-4 pr-2 text-paper shadow-[0_12px_30px_-8px_rgba(0,0,0,0.55)] transition hover:opacity-90 active:scale-[0.98] sm:w-auto"
      >
        <span className="relative">
          <BagIcon className="h-6 w-6" />
          <span
            key={count}
            className="absolute -right-2 -top-2 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-terracotta px-1 text-[0.65rem] font-bold text-white"
          >
            {count}
          </span>
        </span>
        <span className="flex-1 text-left text-sm font-semibold sm:text-base">
          Ver pedido
          <span className="block text-[0.7rem] font-medium text-paper/70 sm:hidden">
            {count} {count === 1 ? "artículo" : "artículos"}
          </span>
        </span>
        <span className="rounded-full bg-mustard px-3.5 py-2 text-sm font-bold tabular-nums text-on-mustard sm:text-base">
          {formatPrice(total)}
        </span>
      </button>
    </div>
  );
}
