import { BagIcon } from "./icons";

interface Props {
  count: number;
  onOpen: () => void;
}

export function CartButton({ count, onOpen }: Props) {
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6 sm:justify-end sm:pr-6">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver pedido, ${count} ${count === 1 ? "artículo" : "artículos"}`}
        title="Ver pedido"
        className="pointer-events-auto relative grid h-14 w-14 animate-rise place-items-center rounded-full bg-ink text-paper shadow-[0_12px_30px_-8px_rgba(0,0,0,0.55)] transition hover:opacity-90 active:scale-[0.96]"
      >
        <BagIcon className="h-6 w-6" />
        <span
          key={count}
          className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-terracotta px-1 text-[0.65rem] font-bold text-white"
        >
          {count}
        </span>
      </button>
    </div>
  );
}
