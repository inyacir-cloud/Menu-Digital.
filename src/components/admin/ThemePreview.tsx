import type { Theme } from "../../types";
import { themeStyle } from "../../utils/color";
import { Blob } from "../Blob";
import { MinusIcon, PlusIcon } from "../icons";

interface Props {
  theme: Theme;
  name: string;
}

/** Miniatura del menú con los colores elegidos */
export function ThemePreview({ theme, name }: Props) {
  const parts = name.split(/\s*&\s*/);

  return (
    <div
      style={themeStyle(theme)}
      aria-hidden="true"
      className="relative select-none overflow-hidden rounded-2xl bg-paper font-sans text-ink shadow-md ring-1 ring-black/10"
    >
      <div className="paper-grain" />
      <Blob className="absolute left-0 top-0 w-[58%]" />
      <Blob flip className="absolute bottom-0 right-0 w-[40%]" />

      <div className="relative">
        {/* Cabecera */}
        <div className="flex items-start justify-between px-3 pt-3">
          <div className="w-[38%] pt-1 text-center">
            <div className="font-display text-[0.8rem] leading-[1.05]">
              {parts[0]}
              {parts[1] ? (
                <>
                  {" "}
                  &amp;
                  <br />
                  {parts[1]}
                </>
              ) : null}
            </div>
          </div>
          <div className="flex-1 pr-2 text-center">
            <div className="font-display text-[2rem] leading-none tracking-wide">MENÚ</div>
            <div className="-rotate-2 font-script text-sm font-bold">¡Buen provecho!</div>
          </div>
        </div>

        {/* Sección */}
        <div className="px-4 pb-3 pt-4">
          <div className="flex gap-1">
            <span className="rounded-full bg-ink px-2 py-0.5 text-[0.55rem] font-semibold text-paper">Tacos</span>
            <span className="rounded-full border border-ink/20 bg-surface/40 px-2 py-0.5 text-[0.55rem] font-semibold">
              Burritos
            </span>
            <span className="rounded-full border border-ink/20 bg-surface/40 px-2 py-0.5 text-[0.55rem] font-semibold">
              Bebidas
            </span>
          </div>

          <p className="mt-3 text-base font-bold">Tacos</p>
          <span className="mt-0.5 block h-0.5 w-6 rounded-full bg-mustard" />

          <ul className="mt-2 space-y-1 text-[0.7rem]">
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-ink" />
              <span>Arrachera</span>
              <span className="mb-[3px] flex-1 border-b border-dotted border-ink/25" />
              <span className="font-semibold">$40</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-mustard text-on-mustard">
                <PlusIcon className="h-2.5 w-2.5" />
              </span>
            </li>
            <li className="-mx-1 flex items-center gap-1.5 rounded-md bg-mustard/15 px-1 py-0.5">
              <span className="h-1 w-1 rounded-full bg-ink" />
              <span className="font-semibold">Bistec</span>
              <span className="rounded-full bg-mustard px-1 text-[0.45rem] font-bold uppercase text-on-mustard">
                Top
              </span>
              <span className="mb-[3px] flex-1 border-b border-dotted border-ink/25" />
              <span className="font-semibold">$35</span>
              <span className="flex items-center gap-0.5 rounded-full bg-ink p-[2px] text-paper">
                <span className="grid h-4 w-4 place-items-center">
                  <MinusIcon className="h-2 w-2" />
                </span>
                <span className="text-[0.6rem] font-bold">2</span>
                <span className="grid h-4 w-4 place-items-center rounded-full bg-mustard text-on-mustard">
                  <PlusIcon className="h-2 w-2" />
                </span>
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-ink" />
              <span>Pechuga</span>
              <span className="mb-[3px] flex-1 border-b border-dotted border-ink/25" />
              <span className="font-semibold">$40</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-mustard text-on-mustard">
                <PlusIcon className="h-2.5 w-2.5" />
              </span>
            </li>
          </ul>

          <div className="mt-2 flex items-center gap-1 text-[0.55rem]">
            <span className="font-bold uppercase tracking-widest text-ink/50">Extras</span>
            <span className="rounded-full border border-dashed border-ink/30 bg-surface/40 px-1.5 font-semibold">
              Con queso <span className="text-mustard-ink">+$7</span>
            </span>
          </div>
        </div>

        {/* Botón del carrito */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between rounded-full bg-ink py-1 pl-3 pr-1 text-[0.65rem] font-semibold text-paper">
            <span>Ver pedido · 3 artículos</span>
            <span className="rounded-full bg-mustard px-2 py-0.5 font-bold text-on-mustard">$150</span>
          </div>
        </div>
      </div>
    </div>
  );
}
