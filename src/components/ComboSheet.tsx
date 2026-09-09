import { useEffect, useRef, useState } from "react";
import type { Combo, ComboSelection } from "../types";
import { formatPrice } from "../utils/format";
import { CheckIcon, CloseIcon } from "./icons";
import { cn } from "../utils/cn";

interface Props {
  combo: Combo;
  closed?: boolean;
  onClose: () => void;
  onAdd: (selections: ComboSelection[]) => void;
}

export function ComboSheet({ combo, closed, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);

  const toggle = (groupId: string, optionId: string, max: number) => {
    setSelected((current) => {
      const values = current[groupId] ?? [];
      if (values.includes(optionId)) return { ...current, [groupId]: values.filter((id) => id !== optionId) };
      if (values.length >= max) return current;
      return { ...current, [groupId]: [...values, optionId] };
    });
  };
  const selections = combo.groups.flatMap((group) => (selected[group.id] ?? []).flatMap((optionId) => {
    const option = group.options.find((candidate) => candidate.id === optionId);
    const groupTitle = group.selectionMode === "category" && group.categoryTitle
      ? `Elige tu ${group.categoryTitle.toLocaleLowerCase()}`
      : group.title;
    return option ? [{ groupId: group.id, groupTitle, optionId: option.id, itemId: option.itemId, label: option.label, categoryTitle: option.categoryTitle ?? group.categoryTitle }] : [];
  }));
  const valid = combo.groups.every((group) => (selected[group.id] ?? []).length >= group.minSelections);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="combo-title" className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-paper-light text-ink shadow-2xl sm:max-w-md sm:rounded-3xl">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface text-ink shadow ring-1 ring-ink/10"><CloseIcon className="h-4 w-4" /></button>
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-sky-700">Combo</p>
          <div className="mt-1 flex items-start justify-between gap-3"><h2 id="combo-title" className="text-2xl font-extrabold leading-tight">{combo.name}</h2><span className="shrink-0 text-2xl font-extrabold">{formatPrice(combo.price)}</span></div>
          {combo.description && <p className="mt-2 text-sm text-ink/70">{combo.description}</p>}
          <div className="mt-5 space-y-5">
            {combo.groups.map((group) => {
              const values = selected[group.id] ?? [];
              const groupTitle = group.selectionMode === "category" && group.categoryTitle
                ? `Elige tu ${group.categoryTitle.toLocaleLowerCase()}`
                : group.title;
              return <section key={group.id}>
                <div className="flex items-baseline justify-between"><h3 className="text-sm font-bold">{groupTitle}</h3><span className={cn("text-xs", values.length >= group.minSelections ? "text-emerald-700" : "text-terracotta-deep")}>{values.length} de {group.maxSelections}</span></div>
                <p className="mt-1 text-xs text-ink/60">{group.required ? "Elige una opción para continuar." : "Opcional."}</p>
                <ul className="mt-2 divide-y divide-ink/8 overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/8">{group.options.map((option) => { const on = values.includes(option.id); return <li key={option.id}><button type="button" disabled={closed || option.unavailable || (!on && values.length >= group.maxSelections)} onClick={() => toggle(group.id, option.id, group.maxSelections)} className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-paper/60 disabled:opacity-45"><span className={cn("grid h-5 w-5 place-items-center rounded-md border-2", on ? "border-ink bg-ink text-paper" : "border-ink/30")} >{on && <CheckIcon className="h-3 w-3" />}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{option.label}</span>{(option.categoryTitle || group.categoryTitle) && <span className="block text-xs font-medium text-ink/50">{option.categoryTitle || group.categoryTitle}</span>}</span>{on && <span className="text-xs font-bold text-sky-700">Elegido</span>}</button></li>; })}</ul>
              </section>;
            })}
          </div>
        </div>
        <footer className="border-t border-ink/10 bg-surface p-4"><button type="button" disabled={closed || !valid} onClick={() => onAdd(selections)} className="flex w-full items-center justify-between rounded-full bg-ink px-5 py-3 font-bold text-paper disabled:cursor-not-allowed disabled:opacity-45"><span>{closed ? "Cerrado por ahora" : valid ? "Agregar combo" : "Completa tu combo"}</span><span>{formatPrice(combo.price)}</span></button></footer>
      </div>
    </div>
  );
}
