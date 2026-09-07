import { cn } from "../utils/cn";

/** Etiqueta destacada ("Recomendado", "Lo más pedido"…) con espacio propio */
export function ItemBadge({ text, className }: { text: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full bg-mustard px-2.5 py-[0.34rem] text-[0.62rem] font-bold uppercase leading-none tracking-[0.09em] text-on-mustard shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {text}
    </span>
  );
}
