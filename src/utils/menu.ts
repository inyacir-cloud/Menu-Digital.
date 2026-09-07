import type { CartLine, Extra, MenuItem, SizeOption } from "../types";

/** Extras que puede elegir el cliente: solo los propios del producto */
export function availableExtras(item: MenuItem): Extra[] {
  return item.extras ?? [];
}

/** Precio más bajo de un producto (tamaño más chico) para mostrarlo en el menú */
export function minPrice(item: MenuItem): number {
  if (item.sizes && item.sizes.length > 0) {
    return Math.min(...item.sizes.map((s) => s.price));
  }
  return item.price;
}

/** Nombre corto del tamaño para mostrar en la vista pública: "Medio litro" → "1/2 L" */
export function shortSizeName(name: string): string {
  return name
    .replace(/medio\s*litro/gi, "1/2 L")
    .replace(/\blitro\b/gi, "1 L")
    .replace(/^1\/2 L$/i, "1/2 L");
}

/** Tamaños disponibles de un producto (los que no están apagados) */
export function availableSizes(item: MenuItem): SizeOption[] {
  const off = new Set(item.unavailableSizes ?? []);
  return (item.sizes ?? []).filter((s) => !off.has(s.id));
}

/** ¿El producto se puede pedir hoy? (encendido y con al menos un tamaño disponible) */
export function isAvailable(item: MenuItem): boolean {
  if (item.unavailable) return false;
  const sizes = item.sizes ?? [];
  return sizes.length === 0 || availableSizes(item).length > 0;
}

/** Precio unitario de una línea del carrito (tamaño + extras) */
export function lineUnitPrice(line: CartLine): number {
  const base = line.size?.price ?? line.price;
  return base + line.extras.reduce((sum, e) => sum + e.price, 0);
}

export function lineTotal(line: CartLine): number {
  return lineUnitPrice(line) * line.qty;
}

/** Limpia una lista de extras editada en el panel (quita vacíos, normaliza precios) */
export function cleanExtras(extras: Extra[]): Extra[] {
  return extras
    .map((e) => ({
      id: e.id,
      name: e.name.trim(),
      price: Math.max(0, Math.round((Number(e.price) || 0) * 100) / 100),
    }))
    .filter((e) => e.name.length > 0);
}

/** Limpia una lista de tamaños editada en el panel */
export function cleanSizes(sizes: SizeOption[]): SizeOption[] {
  return sizes
    .map((s) => ({
      id: s.id,
      name: s.name.trim(),
      price: Math.max(0, Math.round((Number(s.price) || 0) * 100) / 100),
    }))
    .filter((s) => s.name.length > 0);
}
