import { cn } from "../utils/cn";
import crownImage from "../../corona.png";

/** Etiqueta destacada ("Recomendado", "Lo más pedido"…) con espacio propio */
export function ItemBadge({ text, className }: { text: string; className?: string }) {
  const isRecommended = text.trim().toLocaleLowerCase() === "recomendado";

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full bg-mustard px-2.5 py-[0.34rem] text-[0.62rem] font-bold uppercase leading-none tracking-[0.09em] text-on-mustard shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {isRecommended && (
        <img
          src={crownImage}
          alt=""
          aria-hidden="true"
          className="mr-1 h-4 w-4 shrink-0 object-contain sm:h-[1.1rem] sm:w-[1.1rem]"
        />
      )}
      {text}
    </span>
  );
}
