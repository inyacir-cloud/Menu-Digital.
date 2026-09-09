import { useCallback, useMemo } from "react";
import type { AddOptions, CartLine, Extra, MenuCategory, MenuItem } from "../types";
import { availableExtras, lineUnitPrice } from "../utils/menu";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "egf-menu-cart-v3";

function makeKey(itemId: string, sizeId: string | undefined, extras: Extra[], note: string, comboSelections: CartLine["comboSelections"] = []): string {
  const ids = extras
    .map((e) => e.id)
    .sort()
    .join(",");
  const comboKey = comboSelections.map((selection) => `${selection.groupId}:${selection.optionId}`).sort().join(",");
  return `${itemId}|${sizeId ?? ""}|${ids}|${comboKey}|${note.trim().toLowerCase()}`;
}

/** Índice de la línea más reciente de un producto (para +/− desde el menú) */
function latestIndex(lines: CartLine[], itemId: string): number {
  let idx = -1;
  let best = -1;
  lines.forEach((l, i) => {
    if (l.itemId === itemId && l.addedAt >= best) {
      best = l.addedAt;
      idx = i;
    }
  });
  return idx;
}

function changeQty(lines: CartLine[], index: number, delta: number): CartLine[] {
  if (index < 0) return lines;
  const next = [...lines];
  const qty = next[index].qty + delta;
  if (qty <= 0) next.splice(index, 1);
  else next[index] = { ...next[index], qty, addedAt: Date.now() };
  return next;
}

export function useCart() {
  const [lines, setLines] = useLocalStorage<CartLine[]>(STORAGE_KEY, []);

  const add = useCallback(
    (item: MenuItem, category: MenuCategory, opts: AddOptions = {}) => {
      const extras = (opts.extras ?? []).map(({ id, name, price }) => ({ id, name, price }));
      const size = opts.size ? { ...opts.size } : undefined;
      const note = (opts.note ?? "").trim();
      const qty = Math.max(1, Math.round(opts.qty ?? 1));
      const comboSelections = opts.comboSelections?.map((selection) => ({ ...selection })) ?? [];
      const key = makeKey(item.id, size?.id, extras, note, comboSelections);
      const now = Date.now();
      setLines((prev) => {
        const idx = prev.findIndex((l) => l.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty, addedAt: now };
          return next;
        }
        return [
          ...prev,
          {
            key,
            itemId: item.id,
            categoryId: category.id,
            categoryTitle: category.title,
            name: item.cartName ?? item.name,
            price: item.price,
            size,
            extras,
            note,
            qty,
            addedAt: now,
            comboSelections,
          },
        ];
      });
    },
    [setLines],
  );

  const incrementLine = useCallback(
    (key: string) => setLines((prev) => changeQty(prev, prev.findIndex((l) => l.key === key), 1)),
    [setLines],
  );

  const decrementLine = useCallback(
    (key: string) => setLines((prev) => changeQty(prev, prev.findIndex((l) => l.key === key), -1)),
    [setLines],
  );

  const removeLine = useCallback(
    (key: string) => setLines((prev) => prev.filter((l) => l.key !== key)),
    [setLines],
  );

  const incrementItem = useCallback(
    (itemId: string) => setLines((prev) => changeQty(prev, latestIndex(prev, itemId), 1)),
    [setLines],
  );

  const decrementItem = useCallback(
    (itemId: string) => setLines((prev) => changeQty(prev, latestIndex(prev, itemId), -1)),
    [setLines],
  );

  const clear = useCallback(() => setLines([]), [setLines]);

  /**
   * Mantiene el carrito coherente con el menú actual: quita productos que ya
   * no existen o están agotados y actualiza nombres, precios y extras editados.
   */
  const sync = useCallback(
    (categories: MenuCategory[], combos: MenuItem[] = []) => {
      setLines((prev) => {
        if (prev.length === 0) return prev;
        const index = new Map<string, { item: MenuItem; category: MenuCategory }>();
        for (const c of categories) for (const it of c.items) index.set(it.id, { item: it, category: c });
        if (combos.length > 0) {
          const comboCategory: MenuCategory = { id: "combos", title: "Combos", items: combos, imageSide: "right" };
          for (const item of combos) index.set(item.id, { item, category: comboCategory });
        }

        const merged = new Map<string, CartLine>();
        for (const l of prev) {
          const found = index.get(l.itemId);
          if (!found || found.item.unavailable) continue;
          const avail = new Map(availableExtras(found.item).map((e) => [e.id, e] as const));
          const extras = l.extras.flatMap((e) => {
            const a = avail.get(e.id);
            return a ? [{ id: a.id, name: a.name, price: a.price }] : [];
          });
          // Si el tamaño ya no existe o está apagado, esa línea se retira
          const size = l.size
            ? found.item.sizes?.find((s) => s.id === l.size!.id && !found.item.unavailableSizes?.includes(s.id)) ??
              undefined
            : undefined;
          if (l.size && !size) continue;
          const key = makeKey(l.itemId, size?.id, extras, l.note, l.comboSelections);
          const updated: CartLine = {
            ...l,
            key,
            size,
            extras,
            name: found.item.cartName ?? found.item.name,
            price: found.item.price,
            categoryId: found.category.id,
            categoryTitle: found.category.title,
            comboSelections: l.comboSelections,
          };
          const existing = merged.get(key);
          merged.set(
            key,
            existing
              ? { ...existing, qty: existing.qty + updated.qty, addedAt: Math.max(existing.addedAt, updated.addedAt) }
              : updated,
          );
        }
        const next = Array.from(merged.values());
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
    },
    [setLines],
  );

  const qtyOf = useCallback(
    (itemId: string) => lines.reduce((sum, l) => (l.itemId === itemId ? sum + l.qty : sum), 0),
    [lines],
  );

  const { count, total } = useMemo(
    () =>
      lines.reduce(
        (acc, l) => ({ count: acc.count + l.qty, total: acc.total + lineUnitPrice(l) * l.qty }),
        { count: 0, total: 0 },
      ),
    [lines],
  );

  return {
    lines,
    add,
    incrementLine,
    decrementLine,
    removeLine,
    incrementItem,
    decrementItem,
    clear,
    sync,
    qtyOf,
    count,
    total,
  };
}

export type CartApi = ReturnType<typeof useCart>;
