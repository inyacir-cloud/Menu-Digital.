import type { Ref } from "react";
import type { CartLine, CustomerInfo } from "../types";
import { formatPrice } from "../utils/format";
import { lineTotal, shortSizeName } from "../utils/menu";
import { mapsLink } from "../utils/geo";

interface Props {
  ticketRef: Ref<HTMLDivElement>;
  businessName: string;
  lines: CartLine[];
  customer: CustomerInfo;
  paymentLabel: string;
  subtotal: number;
  discount: number;
  total: number;
  cashChange: number | null;
  couponCode?: string;
}

export function OrderTicket({
  ticketRef,
  businessName,
  lines,
  customer,
  paymentLabel,
  subtotal,
  discount,
  total,
  cashChange,
  couponCode,
}: Props) {
  const createdAt = new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  return (
    <article
      ref={ticketRef}
      aria-label="Ticket digital del pedido"
      className="mx-auto w-full max-w-[22.5rem] border border-ink/10 bg-white px-5 py-5 text-ink shadow-sm"
    >
      <header className="border-b border-dashed border-ink/20 pb-4 text-center">
        <p className="text-lg font-extrabold">{businessName}</p>
        <p className="mt-1 text-[0.65rem] font-bold uppercase">Ticket digital de pedido</p>
        <p className="mt-1 text-xs text-ink/55">{createdAt}</p>
      </header>

      <section className="border-b border-dashed border-ink/20 py-4">
        <h3 className="mb-3 text-xs font-bold uppercase">Artículos</h3>
        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line.key} className="text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 font-semibold">
                  {line.qty} × {line.name}{line.size && ` (${shortSizeName(line.size.name)})`}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(lineTotal(line))}</span>
              </div>
              {line.extras.length > 0 && (
                <p className="mt-1 text-ink/60">{line.extras.map((extra) => extra.name).join(" · ")}</p>
              )}
              {(line.comboSelections?.length ?? 0) > 0 && (
                <p className="mt-1 text-ink/60">{line.comboSelections?.map((selection) => selection.label).join(" · ")}</p>
              )}
              {line.note && <p className="mt-1 italic text-ink/60">Nota: {line.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 border-b border-dashed border-ink/20 py-4 text-xs">
        <h3 className="mb-2 font-bold uppercase">Cliente y entrega</h3>
        <p><span className="font-semibold">Nombre:</span> {customer.name}</p>
        <p><span className="font-semibold">Entrega:</span> {customer.mode === "envio" ? "A domicilio" : "Recoger en local"}</p>
        {customer.mode === "envio" && customer.address && (
          <p className="break-words"><span className="font-semibold">Dirección:</span> {customer.address}</p>
        )}
        {customer.mode === "envio" && customer.location && (
          <p className="break-all"><span className="font-semibold">Ubicación:</span> {mapsLink(customer.location)}</p>
        )}
        {customer.notes && <p className="break-words"><span className="font-semibold">Notas:</span> {customer.notes}</p>}
      </section>

      <section className="space-y-2 py-4 text-xs">
        <h3 className="font-bold uppercase">Pago</h3>
        <p>{paymentLabel || "Por definir"}</p>
        {customer.payment === "efectivo" && customer.cashAmount && (
          <p>Pago con {formatPrice(Number(customer.cashAmount))}</p>
        )}
        {customer.payment === "efectivo" && cashChange !== null && (
          <p className="font-semibold">Cambio: {formatPrice(cashChange)}</p>
        )}
        {couponCode && <p>Cupón {couponCode}: −{formatPrice(discount)}</p>}
      </section>

      <footer className="space-y-1 border-t border-ink/15 pt-3 text-sm">
        <div className="flex justify-between gap-3 text-xs">
          <span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-xs">
            <span>Descuento</span><span className="tabular-nums">−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3 pt-1 font-extrabold">
          <span>Total</span><span className="tabular-nums">{formatPrice(total)}</span>
        </div>
        <p className="pt-3 text-center text-[0.65rem] text-ink/55">Gracias por tu pedido.</p>
      </footer>
    </article>
  );
}
