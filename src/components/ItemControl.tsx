import { cn } from "../utils/cn";
import { LockIcon, MinusIcon, PlusIcon } from "./icons";

interface Props {
  name: string;
  qty: number;
  unavailable?: boolean;
  /** Negocio cerrado: el menú es solo de consulta */
  closed?: boolean;
  onAdd: () => void;
  onDecrement: () => void;
  className?: string;
}

/** Botón "+" / control de cantidad que aparece junto a cada precio */
export function ItemControl({ name, qty, unavailable, closed, onAdd, onDecrement, className }: Props) {
  if (closed) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-ink/20 bg-ink/5 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink/50",
          className,
        )}
      >
        <LockIcon className="h-3 w-3" />
        Cerrado
      </span>
    );
  }

  if (unavailable) {
    return (
      <span
        className={cn(
          "whitespace-nowrap rounded-full border border-ink/20 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-ink/50",
          className,
        )}
      >
        Agotado
      </span>
    );
  }

  if (qty > 0) {
    return (
      <div className={cn("flex animate-pop items-center gap-0.5 rounded-full bg-ink p-0.5 text-paper shadow-md", className)}>
        <button
          type="button"
          onClick={onDecrement}
          aria-label={`Quitar uno de ${name}`}
          className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-paper/20 active:scale-90 sm:h-8 sm:w-8"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[1.1rem] text-center text-sm font-bold tabular-nums">{qty}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Agregar otro ${name}`}
          className="grid h-7 w-7 place-items-center rounded-full bg-mustard text-on-mustard transition hover:bg-mustard-deep active:scale-90 sm:h-8 sm:w-8"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Agregar ${name} al pedido`}
      title="Agregar al pedido"
      className={cn(
        "group grid h-9 w-9 place-items-center rounded-full bg-mustard text-on-mustard shadow-[0_2px_0_0_var(--color-mustard-deep)] transition-all hover:-translate-y-0.5 hover:bg-mustard-deep hover:shadow-[0_4px_0_0_var(--color-terracotta-deep)] active:translate-y-0.5 active:shadow-none",
        className,
      )}
    >
      <PlusIcon className="h-4.5 w-4.5 transition-transform group-hover:rotate-90" />
    </button>
  );
}
