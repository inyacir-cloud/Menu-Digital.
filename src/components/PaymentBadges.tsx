import type { PaymentId, PaymentMethod } from "../types";
import { cn } from "../utils/cn";
import mercadoPagoLogo from "../../MP1.png";
import { BankIcon, CashIcon } from "./icons";

export function PaymentIcon({ id, className }: { id: PaymentId; className?: string }) {
  if (id === "efectivo") {
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-full bg-emerald-600 text-white", className)}>
        <CashIcon className="h-[60%] w-[60%]" />
      </span>
    );
  }
  if (id === "transferencia") {
    return (
      <span className={cn("grid shrink-0 place-items-center rounded-full bg-ink text-paper", className)}>
        <BankIcon className="h-[60%] w-[60%]" />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-block shrink-0", className)}
      role="img"
      aria-label="Logo de Mercado Pago"
    >
      <img
        src={mercadoPagoLogo}
        alt=""
        aria-hidden="true"
        className="block h-auto w-full"
      />
    </span>
  );
}

interface Props {
  payments: PaymentMethod[];
  className?: string;
}

/** Franja pública "Formas de pago" */
export function PaymentBadges({ payments, className }: Props) {
  const enabled = payments.filter((p) => p.enabled);
  if (enabled.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2", className)}>
      <span className="mr-1 text-[0.7rem] font-bold uppercase tracking-[0.22em] text-ink/60">
        Formas de pago
      </span>
      {enabled.map((p) => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-surface/60 py-1 pl-1 pr-3 text-sm font-semibold text-ink"
        >
          <PaymentIcon id={p.id} className={p.id === "mercadopago" ? "w-6" : "h-6 w-6"} />
          {p.label}
        </span>
      ))}
    </div>
  );
}
