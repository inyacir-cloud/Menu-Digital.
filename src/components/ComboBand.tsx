import type { Combo } from "../types";
import { formatPrice } from "../utils/format";
import { GlassIceIcon, HelpIcon, PlusIcon } from "./icons";

interface Props {
  combos: Combo[];
  closed?: boolean;
  qtyOf: (id: string) => number;
  onOpen: (combo: Combo) => void;
}

export function ComboBand({ combos, closed, qtyOf, onOpen }: Props) {
  const visible = combos.filter((combo) => combo.enabled && combo.groups.every((group) => group.options.filter((option) => !option.unavailable).length >= group.minSelections));
  if (visible.length === 0) return null;

  return (
    <section id="combos" className="scroll-mt-24" aria-labelledby="combos-title">
      <div className="rounded-[1.75rem] border-2 border-dashed border-sky-300 bg-sky-50/80 px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-400 text-white shadow-sm">
            <GlassIceIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="combos-title" className="text-[1.9rem] font-bold tracking-tight text-ink sm:text-4xl">Combos</h2>
            <span className="mt-1 block h-1 w-10 rounded-full bg-sky-400" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink/80">
            <HelpIcon className="h-3.5 w-3.5 text-sky-500" /> Elige tus favoritos
          </span>
        </header>
        <ul className="mt-3 space-y-1 sm:pl-2">
          {visible.map((combo) => {
            const qty = qtyOf(combo.id);
            return (
              <li key={combo.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/60">
                <button type="button" onClick={() => onOpen(combo)} className="min-w-0 flex-1 text-left">
                  <span className="block text-[1.05rem] font-semibold text-ink sm:text-lg">{combo.name}</span>
                  {combo.description && <span className="block text-sm text-ink/60">{combo.description}</span>}
                  {combo.badge && <span className="text-xs font-bold uppercase tracking-wider text-sky-700">{combo.badge}</span>}
                </button>
                <span className="shrink-0 text-lg font-bold tabular-nums text-ink">{formatPrice(combo.price)}</span>
                <button type="button" onClick={() => onOpen(combo)} disabled={closed} aria-label={`Agregar ${combo.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mustard text-on-mustard shadow-sm transition hover:bg-mustard-deep disabled:cursor-not-allowed disabled:opacity-40">
                  {qty > 0 ? <span className="text-sm font-bold">{qty}</span> : <PlusIcon className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
