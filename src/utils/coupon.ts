import type { Coupon } from "../types";
import { formatPrice } from "./format";

/** Cupón que el cliente tiene escrito en el carrito (validado o con error) */
export interface AppliedCoupon {
  code: string;
  coupon: Coupon | null;
  discount: number;
  error: string | null;
}

/** Descuento en pesos que produce el cupón sobre un subtotal */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.type === "percent" ? (subtotal * Math.min(100, coupon.value)) / 100 : coupon.value;
  return Math.min(subtotal, Math.round(raw * 100) / 100);
}

/** Motivo por el que el cupón no aplica ahora mismo; null si sí aplica */
export function couponError(coupon: Coupon, subtotal: number, now = new Date()): string | null {
  if (!coupon.enabled) return "Este cupón está pausado por el negocio.";
  if (coupon.expiresAt && new Date(`${coupon.expiresAt}T23:59:59`) < now)
    return "Este cupón ya expiró.";
  if (coupon.maxUses > 0 && coupon.used >= coupon.maxUses)
    return `Este cupón ya llegó a su máximo de ${coupon.maxUses} usos.`;
  if (coupon.minOrder && subtotal < coupon.minOrder)
    return `Este cupón aplica en pedidos desde ${formatPrice(coupon.minOrder)}.`;
  return null;
}

/** "10% de descuento" / "$30 de descuento" */
export function couponLabel(coupon: Coupon): string {
  return coupon.type === "percent"
    ? `${coupon.value}% de descuento`
    : `${formatPrice(coupon.value)} de descuento`;
}

/** Condiciones resumidas para mostrar un cupón en novedades públicas. */
export function couponConditions(coupon: Coupon): string {
  const conditions = [couponLabel(coupon)];
  conditions.push(
    coupon.minOrder && coupon.minOrder > 0
      ? `pedido mínimo de ${formatPrice(coupon.minOrder)}`
      : "sin compra mínima",
  );
  conditions.push(
    coupon.expiresAt
      ? `válido hasta el ${coupon.expiresAt.split("-").reverse().join("/")}`
      : "sin fecha de vencimiento",
  );
  conditions.push(
    coupon.maxUses > 0
      ? `${Math.max(0, coupon.maxUses - coupon.used)} uso${coupon.maxUses - coupon.used === 1 ? "" : "s"} disponible${coupon.maxUses - coupon.used === 1 ? "" : "s"}`
      : "usos ilimitados",
  );
  return conditions.join(" · ");
}

export function isExpired(coupon: Coupon, now = new Date()): boolean {
  return !!coupon.expiresAt && new Date(`${coupon.expiresAt}T23:59:59`) < now;
}
