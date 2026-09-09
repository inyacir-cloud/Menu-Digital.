import type { CartLine, CustomerInfo, Settings } from "../types";
import { DEFAULT_MESSAGE_TEMPLATE } from "../data/menu";
import { formatPrice } from "./format";
import { mapsLink } from "./geo";
import { lineTotal } from "./menu";
import { renderTemplate } from "./template";

/** Bloque {pedido}: productos agrupados por categoría con extras y notas */
function buildOrderBlock(lines: CartLine[]): string {
  const groups = new Map<string, CartLine[]>();
  for (const line of lines) {
    const arr = groups.get(line.categoryTitle) ?? [];
    arr.push(line);
    groups.set(line.categoryTitle, arr);
  }

  const out: string[] = [];
  for (const [category, items] of groups) {
    out.push(`*${category}*`);
    for (const l of items) {
      const sizeLabel = l.size ? ` (${l.size.name})` : "";
      out.push(`▪️ ${l.qty} × ${l.name}${sizeLabel} — ${formatPrice(lineTotal(l))}`);
      for (const e of l.extras) {
        out.push(e.price > 0 ? `     ↳ ${e.name} (+${formatPrice(e.price)} c/u)` : `     ↳ ${e.name}`);
      }
      if (l.note) out.push(`     📝 ${l.note}`);
    }
    out.push("");
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out.join("\n");
}

export interface OrderCoupon {
  code: string;
  discount: number;
}

/** Valores de cada marcador de la plantilla para un pedido concreto */
export function buildOrderVars(
  lines: CartLine[],
  customer: CustomerInfo,
  settings: Settings,
  coupon: OrderCoupon | null = null,
): Record<string, string> {
  const subtotal = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const total = Math.max(0, subtotal - (coupon?.discount ?? 0));
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  const payment = settings.payments.find((p) => p.id === customer.payment && p.enabled);
  let pago = "";
  if (payment) {
    pago = payment.label;
    if (payment.id === "efectivo") {
      const cash = Number(customer.cashAmount.replace(/[^\d.]/g, ""));
      if (cash > 0) {
        pago += ` (pago con ${formatPrice(cash)}`;
        if (cash > total) pago += `, cambio de ${formatPrice(cash - total)}`;
        pago += ")";
      }
    }
  }

  const now = new Date();
  return {
    negocio: settings.name,
    pedido: buildOrderBlock(lines),
    total: formatPrice(total),
    articulos: String(count),
    nombre: customer.name.trim(),
    entrega: customer.mode === "envio" ? "Envío a domicilio" : "Paso a recoger",
    direccion: customer.mode === "envio" ? customer.address.trim() : "",
    mapa: customer.mode === "envio" && customer.location ? mapsLink(customer.location) : "",
    pago,
    notas: customer.notes.trim(),
    cupon: coupon ? `${coupon.code} (−${formatPrice(coupon.discount)})` : "",
    propina:
      customer.mode === "envio"
        ? "🛵💛 Con gusto dejo propina para el repartidor. ¡Gracias por llevar mi pedido calientito hasta mi puerta!"
        : "",
    confirmacion:
      payment && payment.id !== "efectivo"
        ? "📸 Enseguida les mando la captura de pantalla de mi pago para la confirmación del pedido."
        : "",
    fecha: now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }),
    hora: now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
  };
}

export function buildOrderMessage(
  lines: CartLine[],
  customer: CustomerInfo,
  settings: Settings,
  coupon: OrderCoupon | null = null,
): string {
  const template = settings.messageTemplate.trim() ? settings.messageTemplate : DEFAULT_MESSAGE_TEMPLATE;
  return renderTemplate(template, buildOrderVars(lines, customer, settings, coupon));
}

export function buildWhatsAppUrl(message: string, phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/* ---------- Pedido de muestra para la vista previa del mensaje ---------- */

export const SAMPLE_LINES: CartLine[] = [
  {
    key: "sample-1",
    itemId: "taco-arrachera",
    categoryId: "tacos",
    categoryTitle: "Tacos",
    name: "Arrachera",
    price: 40,
    extras: [{ id: "extra-taco-queso", name: "Con queso", price: 7 }],
    note: "",
    qty: 2,
    addedAt: 0,
  },
  {
    key: "sample-2",
    itemId: "burrito-especial",
    categoryId: "burritos",
    categoryTitle: "Burritos",
    name: "Especial",
    price: 90,
    extras: [],
    note: "sin cebolla",
    qty: 1,
    addedAt: 0,
  },
  {
    key: "sample-3",
    itemId: "bdi-horchata",
    categoryId: "bebidas-del-dia",
    categoryTitle: "Bebidas del día",
    name: "Agua de horchata",
    price: 20,
    size: { id: "litro", name: "Litro", price: 35 },
    extras: [],
    note: "",
    qty: 2,
    addedAt: 0,
  },
];

export const SAMPLE_CUSTOMER: CustomerInfo = {
  name: "Mariana López",
  mode: "envio",
  address: "Av. Reforma 123, Col. Centro. Portón negro.",
  notes: "Tocar el timbre dos veces",
  payment: "transferencia",
  cashAmount: "",
  location: { lat: 19.4326, lng: -99.1332 },
};
