export interface Placeholder {
  key: string;
  description: string;
}

/** Marcadores disponibles en la plantilla del mensaje de pedido */
export const PLACEHOLDERS: Placeholder[] = [
  { key: "negocio", description: "Nombre del negocio" },
  { key: "pedido", description: "Lista de productos con cantidades, extras y notas" },
  { key: "total", description: "Total a pagar" },
  { key: "articulos", description: "Número de artículos" },
  { key: "nombre", description: "Nombre del cliente" },
  { key: "entrega", description: "“Envío a domicilio” o “Paso a recoger”" },
  { key: "direccion", description: "Dirección (vacía si pasa a recoger)" },
  { key: "mapa", description: "Enlace de Google Maps al punto marcado" },
  { key: "cupon", description: "Cupón aplicado y su descuento (vacío si no hay)" },
  { key: "propina", description: "Agradecimiento y propina al repartidor (solo en envíos)" },
  {
    key: "confirmacion",
    description: "Aviso de captura de pago (transferencia o Mercado Pago)",
  },
  { key: "pago", description: "Forma de pago elegida" },
  { key: "notas", description: "Notas generales del cliente" },
  { key: "fecha", description: "Fecha de hoy" },
  { key: "hora", description: "Hora actual" },
];

const TOKEN = /\{([\p{L}_]+)\}/gu;

/** {Dirección} → "direccion" */
function normalizeKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Marcadores escritos en la plantilla que no existen */
export function unknownPlaceholders(template: string): string[] {
  const known = new Set(PLACEHOLDERS.map((p) => p.key));
  const found = new Set<string>();
  for (const m of template.matchAll(TOKEN)) {
    if (!known.has(normalizeKey(m[1]))) found.add(m[0]);
  }
  return Array.from(found);
}

/**
 * Sustituye los marcadores. Las líneas cuyos marcadores queden todos vacíos
 * (p. ej. "📍 Dirección: {direccion}" al pasar a recoger) se omiten.
 */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  const out: string[] = [];
  for (const line of template.replace(/\r\n/g, "\n").split("\n")) {
    let hasToken = false;
    let allEmpty = true;
    const rendered = line.replace(TOKEN, (match, rawKey: string) => {
      const key = normalizeKey(rawKey);
      if (!Object.prototype.hasOwnProperty.call(vars, key)) return match;
      hasToken = true;
      const value = vars[key];
      if (value.trim() !== "") allEmpty = false;
      return value;
    });
    if (hasToken && allEmpty) continue;
    out.push(rendered.trimEnd());
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
