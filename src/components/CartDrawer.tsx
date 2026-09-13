import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { CartApi } from "../hooks/useCart";
import type { CartLine, CustomerInfo, DeliveryMode, MenuItem, Settings } from "../types";
import type { AppliedCoupon } from "../utils/coupon";
import { couponLabel } from "../utils/coupon";
import { formatPrice } from "../utils/format";
import { lineTotal, lineUnitPrice, shortSizeName } from "../utils/menu";
import { buildOrderMessage, buildWhatsAppUrl } from "../utils/whatsapp";
import { cn } from "../utils/cn";
import {
  BagIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  MinusIcon,
  PinIcon,
  PlusIcon,
  TicketIcon,
  LockIcon,
  TrashIcon,
  WhatsAppIcon,
} from "./icons";
import { PaymentIcon } from "./PaymentBadges";
import { LocationPicker } from "./LocationPicker";

const inputCls =
  "mt-1 w-full rounded-xl border bg-paper/40 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-ink focus:bg-surface focus:ring-2 focus:ring-mustard/40";

function transferAccountNumber(details: string): string | null {
  const lines = details.split(/\r?\n/);
  const labeled = lines.filter((line) => /\b(clabe|cuenta|n[uú]mero de cuenta)\b/i.test(line));
  const candidates = [...labeled, ...lines.filter((line) => !labeled.includes(line))]
    .flatMap((line) => line.match(/(?:\d[\d\s-]?){9,}\d/g) ?? [])
    .map((value) => value.replace(/\D/g, ""))
    .filter((value) => value.length >= 10 && value.length <= 18);

  return candidates.sort((a, b) => (b.length === 18 ? 1 : 0) - (a.length === 18 ? 1 : 0))[0] ?? null;
}

function mercadoPagoLink(details: string): string | null {
  return details.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  cart: CartApi;
  customer: CustomerInfo;
  onCustomerChange: (next: CustomerInfo) => void;
  settings: Settings;
  /** Aviso global al enviar el pedido */
  onSent?: () => void;
  /** Bebidas del día para ofrecerlas al confirmar el pedido */
  suggestions?: MenuItem[];
  onAddSuggestion?: (item: MenuItem) => void;
  /** Cupón escrito por el cliente (ya validado o con error) */
  appliedCoupon: AppliedCoupon | null;
  onApplyCode: (code: string | null) => void;
  onRedeemCoupon: (id: string) => void;
  /** Negocio cerrado: no se pueden enviar pedidos */
  closed?: boolean;
}

interface Group {
  title: string;
  lines: CartLine[];
}

function groupByCategory(lines: CartLine[]): Group[] {
  const map = new Map<string, CartLine[]>();
  for (const l of lines) {
    const arr = map.get(l.categoryTitle) ?? [];
    arr.push(l);
    map.set(l.categoryTitle, arr);
  }
  return Array.from(map, ([title, lines]) => ({ title, lines }));
}

export function CartDrawer({
  open,
  onClose,
  cart,
  customer,
  onCustomerChange,
  settings,
  onSent,
  suggestions = [],
  onAddSuggestion,
  appliedCoupon,
  onApplyCode,
  onRedeemCoupon,
  closed = false,
}: Props) {
  // Wizard Steps (Reordenados):
  // 1: Productos y notas o detalles del pedido
  // 2: Enviar o recoger (Nombre, dirección, mapa pin)
  // 3: Método de pago y Cupón
  // 4: Resumen y enviar
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [attempted, setAttempted] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const couponOk = !!appliedCoupon?.coupon && !appliedCoupon.error;
  const discount = couponOk ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cart.total - discount);

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const paymentRef = useRef<HTMLFieldSetElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stepRef = useRef(step);
  const historyEntryRef = useRef(false);
  const hasItemsRef = useRef(cart.lines.length > 0);
  const sentRef = useRef(sent);

  useEffect(() => {
    stepRef.current = step;
    hasItemsRef.current = cart.lines.length > 0;
    sentRef.current = sent;
  }, [step, cart.lines.length, sent]);

  const requestClose = useCallback(() => {
    if (sentRef.current || !hasItemsRef.current || window.confirm("¿Seguro que quieres salir sin hacer tu pedido?")) {
      onClose();
    }
  }, [onClose]);

  // Bloquear scroll del fondo + cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.history.pushState({ ...(window.history.state ?? {}), egfCart: true }, "", window.location.href);
    historyEntryRef.current = true;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    const onPopState = () => {
      if (stepRef.current > 1) {
        setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4) : current));
        window.history.pushState({ ...(window.history.state ?? {}), egfCart: true }, "", window.location.href);
        return;
      }

      historyEntryRef.current = false;
      onClose();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasItemsRef.current || sentRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (historyEntryRef.current) {
        historyEntryRef.current = false;
        window.history.back();
      }
    };
  }, [open, requestClose]);

  // Al empezar un pedido nuevo se oculta el aviso de envío y se vuelve al paso 1
  useEffect(() => {
    if (cart.lines.length > 0) {
      setSent(false);
    } else {
      setStep(1);
    }
  }, [cart.lines]);

  // Al cerrar o abrir el panel se reinician los estados del asistente
  useEffect(() => {
    if (!open) {
      setSent(false);
      setAttempted(false);
      setStep(1);
    }
  }, [open]);

  const groups = useMemo(() => groupByCategory(cart.lines), [cart.lines]);
  const enabledPayments = useMemo(() => settings.payments.filter((p) => p.enabled), [settings.payments]);
  const selectedPayment = enabledPayments.find((p) => p.id === customer.payment) ?? null;
  const isDelivery = customer.mode === "envio";
  const needsCapture =
    selectedPayment?.id === "transferencia" || selectedPayment?.id === "mercadopago";

  const errors = {
    name: customer.name.trim().length < 2 ? "Escribe tu nombre (mínimo 2 letras)" : "",
    address:
      customer.mode === "envio" && customer.address.trim().length < 5
        ? "Indica tu dirección completa de entrega"
        : "",
    payment: enabledPayments.length > 0 && !selectedPayment ? "Elige una forma de pago para continuar" : "",
  };

  const isStep2Valid = !errors.name && !errors.address;
  const isStep3Valid = !errors.payment;
  const isAllValid = isStep2Valid && isStep3Valid && cart.lines.length > 0;

  const href = useMemo(
    () =>
      buildWhatsAppUrl(
        buildOrderMessage(
          cart.lines,
          customer,
          settings,
          couponOk && appliedCoupon ? { code: appliedCoupon.code, discount } : null,
        ),
        settings.whatsappNumber,
      ),
    [cart.lines, customer, settings, couponOk, appliedCoupon, discount],
  );

  const update = (patch: Partial<CustomerInfo>) => onCustomerChange({ ...customer, ...patch });

  const handleNextToStep2 = () => {
    if (cart.lines.length === 0) return;
    setStep(2);
  };

  const handleNextToStep3 = () => {
    setAttempted(true);
    if (!isStep2Valid) {
      if (errors.name) nameRef.current?.focus();
      else if (errors.address) addressRef.current?.focus();
      return;
    }
    setAttempted(false);
    setStep(3);
  };

  const handleNextToStep4 = () => {
    setAttempted(true);
    if (!isStep3Valid) {
      paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setAttempted(false);
    setStep(4);
  };

  const handleSend = (e: MouseEvent<HTMLAnchorElement>) => {
    if (closed) {
      e.preventDefault();
      return;
    }
    setAttempted(true);
    if (!isAllValid) {
      if (!isStep2Valid) {
        setStep(2);
        setTimeout(() => {
          if (errors.name) nameRef.current?.focus();
          else if (errors.address) addressRef.current?.focus();
        }, 150);
      } else if (!isStep3Valid) {
        setStep(3);
        setTimeout(() => {
          paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
      return;
    }
    if (couponOk && appliedCoupon?.coupon) onRedeemCoupon(appliedCoupon.coupon.id);
    cart.clear();
    setAttempted(false);
    setSent(true);
    onSent?.();
  };

  const copyDetails = async () => {
    if (!selectedPayment?.details) return;
    const copyValue =
      selectedPayment.id === "transferencia"
        ? transferAccountNumber(selectedPayment.details) ?? selectedPayment.details
        : selectedPayment.details;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* portapapeles no disponible */
    }
  };

  const openMercadoPago = () => {
    const link = selectedPayment?.id === "mercadopago" ? mercadoPagoLink(selectedPayment.details) : null;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-ink/80"
        onClick={requestClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-0 flex animate-fade flex-col bg-paper-light text-ink shadow-2xl"
      >
        {/* Encabezado */}
        <header className="border-b border-ink/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-mustard text-on-mustard">
              <BagIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 id="cart-title" className="text-lg font-bold leading-tight">
                Tu pedido
              </h2>
              <p className="text-xs text-ink/60">
                {cart.count === 0
                  ? "Aún no agregas nada"
                  : `${cart.count} ${cart.count === 1 ? "artículo" : "artículos"} · ${settings.name}`}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={requestClose}
              aria-label="Cerrar"
              className="grid h-10 w-10 place-items-center rounded-full text-ink/70 transition hover:bg-ink/10 hover:text-ink"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Barra de progreso por pasos (4 PASOS) */}
          {!sent && cart.lines.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-4 gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-center">
                <span className={cn(step === 1 ? "text-terracotta" : "text-ink/40")}>1. Pedido</span>
                <span className={cn(step === 2 ? "text-terracotta" : "text-ink/40")}>2. Entrega</span>
                <span className={cn(step === 3 ? "text-terracotta" : "text-ink/40")}>3. Pago</span>
                <span className={cn(step === 4 ? "text-terracotta" : "text-ink/40")}>4. Enviar</span>
              </div>
              <div className="mt-1.5 flex h-1.5 gap-1 overflow-hidden rounded-full bg-ink/10">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    step >= 1 ? "bg-terracotta" : "bg-transparent",
                  )}
                  style={{ width: "25%" }}
                />
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    step >= 2 ? "bg-terracotta" : "bg-transparent",
                  )}
                  style={{ width: "25%" }}
                />
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    step >= 3 ? "bg-terracotta" : "bg-transparent",
                  )}
                  style={{ width: "25%" }}
                />
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    step >= 4 ? "bg-terracotta" : "bg-transparent",
                  )}
                  style={{ width: "25%" }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-wa text-white shadow-lg shadow-wa/40">
                <CheckIcon className="h-8 w-8" />
              </span>
              <p className="mt-4 text-lg font-bold">¡Pedido enviado!</p>
              <p className="mt-1 max-w-[30ch] text-sm text-ink/60">
                Abrimos WhatsApp con tu pedido para{" "}
                <span className="font-semibold text-ink">
                  {settings.whatsappDisplay || settings.whatsappNumber}
                </span>
                . Tu carrito quedó vacío, listo para armar uno nuevo.
              </p>

              {needsCapture && (
                <div className="mt-4 w-full max-w-[36ch] animate-fade rounded-2xl border border-dashed border-wa/50 bg-wa/10 p-3.5 text-left text-xs leading-relaxed text-ink/80">
                  📸 <span className="font-bold">Un paso más:</span> manda la captura de pantalla de tu pago en
                  el chat de WhatsApp que se abrió. Con eso confirmamos tu pedido y lo mandamos a cocina.
                </div>
              )}
              {isDelivery && (
                <p className="mt-3 max-w-[34ch] text-xs leading-relaxed text-ink/60">
                  🛵💛 ¡Gracias por tu pedido! La propina que entregues va completa para tu repartidor.
                </p>
              )}

              <button
                type="button"
                onClick={requestClose}
                className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90 active:scale-[0.98]"
              >
                Hacer otro pedido
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {closed && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-red-300 bg-red-50/80 px-4 py-3 text-xs text-ink/75">
                  <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p>
                    <span className="font-bold text-red-700">Cerrado por ahora.</span> Puedes revisar el
                    menú, pero los pedidos se envían en cuanto abramos.
                  </p>
                </div>
              )}
              {/* ------------------------------------------------------------- */}
              {/* PASO 1: PRODUCTOS Y DETALLES                                  */}
              {/* ------------------------------------------------------------- */}
              {step === 1 && (
                <div className="space-y-5 animate-fade">
                  {/* Líneas del pedido */}
                  <div className="space-y-4">
                    {groups.map((g) => (
                      <div key={g.title}>
                        <h3 className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink/50">
                          {g.title}
                        </h3>
                        <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-ink/5">
                          {g.lines.map((l) => (
                            <li key={l.key} className="flex items-center gap-2 px-3 py-2.5 sm:gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold leading-tight">{l.name}</p>
                                {l.size && <p className="text-xs font-semibold text-ink/70">{l.size.name}</p>}
                                {l.extras.length > 0 && (
                                  <p className="text-xs font-medium text-mustard-ink">
                                    {l.extras.map((e) => `+ ${e.name}`).join(" · ")}
                                  </p>
                                )}
                                {(l.comboSelections?.length ?? 0) > 0 && (
                                  <p className="text-xs font-medium text-sky-700">
                                    {l.comboSelections?.map((selection) => selection.label).join(" · ")}
                                  </p>
                                )}
                                {l.note && <p className="truncate text-xs italic text-ink/55">“{l.note}”</p>}
                                <p className="text-xs text-ink/55">{formatPrice(lineUnitPrice(l))} c/u</p>
                              </div>

                              <div className="flex items-center gap-0.5 rounded-full bg-ink p-0.5 text-paper">
                                <button
                                  type="button"
                                  onClick={() => cart.decrementLine(l.key)}
                                  aria-label={`Quitar uno de ${l.name}`}
                                  className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-paper/20"
                                >
                                  <MinusIcon className="h-3 w-3" />
                                </button>
                                <span className="min-w-[1.1rem] text-center text-sm font-bold tabular-nums">
                                  {l.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => cart.incrementLine(l.key)}
                                  aria-label={`Agregar otro ${l.name}`}
                                  className="grid h-7 w-7 place-items-center rounded-full bg-mustard text-on-mustard transition hover:bg-mustard-deep"
                                >
                                  <PlusIcon className="h-3 w-3" />
                                </button>
                              </div>

                              <span className="w-14 text-right text-sm font-bold tabular-nums sm:w-16 sm:text-base">
                                {formatPrice(lineTotal(l))}
                              </span>

                              <button
                                type="button"
                                onClick={() => cart.removeLine(l.key)}
                                aria-label={`Eliminar ${l.name}`}
                                className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Sugerencia: bebidas del día (Upsell) */}
                  {suggestions.length > 0 && (
                    <div className="rounded-2xl bg-mustard/10 p-3 ring-1 ring-mustard/30 animate-fade">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink/60">
                        ¿Agregas una bebida?
                      </p>
                      <ul className="mt-2 grid grid-cols-2 gap-1.5">
                        {suggestions.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => onAddSuggestion?.(s)}
                              disabled={closed}
                              className="flex w-full items-center gap-2 rounded-xl bg-surface px-2.5 py-2 text-left ring-1 ring-ink/8 transition hover:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-ink">{s.name}</span>
                                <span className="block text-[0.65rem] font-medium text-wa-deep">
                                  {(s.sizes ?? [])
                                    .filter((z) => !s.unavailableSizes?.includes(z.id))
                                    .map((z) => `${shortSizeName(z.name)} ${formatPrice(z.price)}`)
                                    .join(" · ")}
                                </span>
                              </span>
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mustard text-on-mustard">
                                <PlusIcon className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notas o detalles del pedido (movidas aquí) */}
                  <div className="rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-ink/5">
                    <label className="block">
                      <span className="text-xs font-semibold text-ink/70">Notas o detalles especiales (opcional)</span>
                      <textarea
                        rows={2.5}
                        value={customer.notes}
                        onChange={(e) => update({ notes: e.target.value })}
                        placeholder="Ej. sin cebolla, salsa aparte, dejas en la puerta, etc."
                        className={cn(inputCls, "resize-none border-ink/15 bg-paper/20")}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PASO 2: ENVIAR O RECOGER                                      */}
              {/* ------------------------------------------------------------- */}
              {step === 2 && (
                <div className="space-y-4 animate-fade">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/50">Entrega</h3>
                  <div className="space-y-3.5 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-ink/5">
                    {/* Nombre */}
                    <label className="block">
                      <span className="text-xs font-semibold text-ink/70">Tu nombre completo *</span>
                      <input
                        ref={nameRef}
                        type="text"
                        autoComplete="name"
                        value={customer.name}
                        onChange={(e) => update({ name: e.target.value })}
                        placeholder="¿Cómo te llamas?"
                        className={cn(inputCls, attempted && errors.name ? "border-red-400" : "border-ink/15")}
                      />
                      {attempted && errors.name && (
                        <span className="mt-1 block text-xs font-medium text-red-600">{errors.name}</span>
                      )}
                    </label>

                    {/* Envío o Recoger */}
                    <fieldset>
                      <legend className="text-xs font-semibold text-ink/70">¿Cómo prefieres recibir tu pedido?</legend>
                      <div className="mt-1.5 grid grid-cols-2 gap-2">
                        {(
                          [
                            { value: "envio", label: "Envío a domicilio", emoji: "🛵" },
                            { value: "recoger", label: "Paso a recoger", emoji: "🏪" },
                          ] as { value: DeliveryMode; label: string; emoji: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update({ mode: opt.value })}
                            aria-pressed={customer.mode === opt.value}
                            className={cn(
                              "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition sm:text-sm",
                              customer.mode === opt.value
                                ? "border-ink bg-ink text-paper"
                                : "border-ink/15 bg-paper/40 text-ink hover:border-ink/40",
                            )}
                          >
                            <span aria-hidden="true">{opt.emoji}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {customer.mode === "envio" && (
                        <p className="mt-1.5 text-[0.7rem] text-ink/55">
                          Los envíos son <span className="font-bold text-ink/80">solo por propina</span> 🙌
                        </p>
                      )}
                    </fieldset>

                    {isDelivery && (
                      <div className="animate-fade rounded-2xl border border-dashed border-mustard/60 bg-mustard/10 p-3.5 text-xs leading-relaxed text-ink/80">
                        🛵💛 <span className="font-bold">Gracias por pedir a domicilio.</span> El envío no tiene
                        costo: la propina que quieras dar va íntegra para el repartidor que lleva tu comida
                        calientita y a tiempo. ¡Él te lo agradecerá con una sonrisa!
                      </div>
                    )}

                    {/* Dirección con pin en mapa */}
                    {customer.mode === "envio" && (
                      <div className="animate-fade space-y-2">
                        <label className="block">
                          <span className="text-xs font-semibold text-ink/70">Dirección completa de entrega *</span>
                          <textarea
                            ref={addressRef}
                            rows={2}
                            autoComplete="street-address"
                            value={customer.address}
                            onChange={(e) => update({ address: e.target.value })}
                            placeholder="Calle, número, colonia, referencias de color de casa o portón"
                            className={cn(
                              inputCls,
                              "resize-none",
                              attempted && errors.address ? "border-red-400" : "border-ink/15",
                            )}
                          />
                        </label>

                        {/* Ubicación en el mapa */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMapOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-terracotta px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-terracotta-deep active:scale-95"
                          >
                            <PinIcon className="h-3.5 w-3.5" />
                            {customer.location ? "Cambiar ubicación" : "Usar mi ubicación / mapa"}
                          </button>

                          {customer.location && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-wa/15 px-2.5 py-1 text-[0.7rem] font-semibold text-wa-deep animate-pop">
                              <CheckIcon className="h-3 w-3" />
                              Punto marcado
                              <button
                                type="button"
                                onClick={() => update({ location: null })}
                                aria-label="Quitar ubicación marcada"
                                className="text-ink/40 transition hover:text-red-600"
                              >
                                <CloseIcon className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </div>

                        {attempted && errors.address && (
                          <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.address}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PASO 3: METODO DE PAGO Y CUPÓN                                */}
              {/* ------------------------------------------------------------- */}
              {step === 3 && (
                <div className="space-y-4 animate-fade">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/50">Pago y Beneficios</h3>

                  {/* Cupón (movido aquí) */}
                  <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-ink/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <TicketIcon className="h-4 w-4 shrink-0 text-terracotta" />
                      <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-ink/70">
                        ¿Tienes un cupón de descuento?
                      </h4>
                    </div>

                    {appliedCoupon ? (
                      <div
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-2 ring-1",
                          couponOk ? "bg-wa/10 ring-wa/30" : "bg-red-50 ring-red-200",
                        )}
                      >
                        <TicketIcon className={cn("h-5 w-5 shrink-0", couponOk ? "text-wa-deep" : "text-red-500")} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-extrabold tracking-wide">{appliedCoupon.code}</p>
                          <p className={cn("text-xs font-medium", couponOk ? "text-wa-deep" : "text-red-600")}>
                            {couponOk && appliedCoupon.coupon
                              ? `${couponLabel(appliedCoupon.coupon)} · −${formatPrice(discount)}`
                              : appliedCoupon.error}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyCode(null);
                            setCodeInput("");
                          }}
                          aria-label="Quitar cupón"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/50 transition hover:bg-ink/10 hover:text-red-600"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          autoComplete="off"
                          spellCheck={false}
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && codeInput.trim()) onApplyCode(codeInput.trim());
                          }}
                          placeholder="Escribe tu código"
                          aria-label="Código de cupón"
                          className={cn(inputCls, "mt-0 flex-1 border-ink/15 font-mono uppercase tracking-wider bg-paper/20")}
                        />
                        <button
                          type="button"
                          disabled={!codeInput.trim()}
                          onClick={() => onApplyCode(codeInput.trim())}
                          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-paper transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Forma de pago */}
                  <div className="space-y-3.5 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-ink/5">
                    {enabledPayments.length > 0 && (
                      <fieldset ref={paymentRef}>
                        <legend className="text-xs font-semibold text-ink/70">¿Cómo vas a pagar? *</legend>
                        <div
                          className={cn(
                            "mt-1.5 grid gap-2",
                            enabledPayments.length >= 3 ? "grid-cols-3" : "grid-cols-2",
                          )}
                        >
                          {enabledPayments.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => update({ payment: p.id })}
                              aria-pressed={customer.payment === p.id}
                              className={cn(
                                "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[0.7rem] font-semibold leading-tight transition sm:text-xs",
                                customer.payment === p.id
                                  ? "border-ink bg-ink text-paper"
                                  : "border-ink/15 bg-paper/40 text-ink hover:border-ink/40",
                                attempted && errors.payment && "border-red-400",
                              )}
                            >
                              <PaymentIcon id={p.id} className="h-7 w-7" />
                              {p.label}
                            </button>
                          ))}
                        </div>
                        {attempted && errors.payment && (
                          <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.payment}</span>
                        )}

                        {selectedPayment?.id === "efectivo" && (
                          <label className="mt-3 block animate-fade">
                            <span className="text-xs font-semibold text-ink/70">¿Con cuánto vas a pagar? (opcional)</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck={false}
                              value={customer.cashAmount}
                              onChange={(e) => update({ cashAmount: e.target.value.replace(/[^\d.]/g, "") })}
                              placeholder="Ej. 200"
                              className={cn(inputCls, "border-ink/15 font-mono bg-paper/20")}
                            />
                            {selectedPayment.details && (
                              <span className="mt-1 block text-[0.7rem] text-ink/55">{selectedPayment.details}</span>
                            )}
                          </label>
                        )}

                        {selectedPayment && selectedPayment.id !== "efectivo" && (
                          <div className="mt-3 animate-fade rounded-xl bg-mustard/15 p-3 text-xs text-ink/80">
                            {selectedPayment.id === "mercadopago" ? (
                              <>
                                <p className="font-bold">Paga con Mercado Pago</p>
                                <ol className="mt-1 list-decimal space-y-0.5 pl-4 leading-relaxed">
                                  <li>Abre el enlace de Mercado Pago.</li>
                                  <li>Coloca el total de tu compra: <strong>{formatPrice(grandTotal)}</strong>.</li>
                                  <li>Confirma el pago en la aplicación.</li>
                                </ol>
                                {mercadoPagoLink(selectedPayment.details) ? (
                                  <button
                                    type="button"
                                    onClick={openMercadoPago}
                                    className="mt-2 inline-flex items-center rounded-full bg-sky-600 px-4 py-2 font-bold text-white transition hover:bg-sky-700"
                                  >
                                    Abrir Mercado Pago
                                  </button>
                                ) : (
                                  <p className="mt-1 text-red-700">El enlace de Mercado Pago aún no está configurado.</p>
                                )}
                              </>
                            ) : selectedPayment.details ? (
                              <>
                                <p className="font-bold">Datos para {selectedPayment.label}</p>
                                <p className="mt-0.5 whitespace-pre-line font-mono">{selectedPayment.details}</p>
                                <button
                                  type="button"
                                  onClick={copyDetails}
                                  className="mt-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                                >
                                  <CopyIcon className="h-3.5 w-3.5" />
                                  {copied
                                    ? "¡Copiado!"
                                    : selectedPayment.id === "transferencia"
                                      ? "Copiar CLABE / cuenta"
                                      : "Copiar datos"}
                                </button>
                              </>
                            ) : (
                              <p>
                                Te enviaremos los datos para tu pago con{" "}
                                <span className="font-bold">{selectedPayment.label}</span> por WhatsApp.
                              </p>
                            )}
                          </div>
                        )}
                      </fieldset>
                    )}
                  </div>

                  {needsCapture && (
                    <div className="animate-fade rounded-2xl border border-dashed border-wa/50 bg-wa/10 p-3.5 text-xs leading-relaxed text-ink/80">
                      📸 <span className="font-bold">Para confirmar tu pedido:</span> esperamos la captura de
                      pantalla de tu pago en el chat de WhatsApp. En cuanto la recibamos, tu pedido entra a
                      cocina. ¡Gracias por tu confianza!
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PASO 4: RESUMEN Y ENVIAR                                      */}
              {/* ------------------------------------------------------------- */}
              {step === 4 && (
                <div className="space-y-4 animate-fade">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/50">Resumen y Confirmar</h3>

                  <div className="space-y-4 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-ink/5">
                    {/* Productos */}
                    <div className="border-b border-ink/8 pb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-ink/55 mb-2">Artículos:</p>
                      <ul className="space-y-1 text-xs">
                        {cart.lines.map((l) => (
                          <li key={l.key} className="flex justify-between items-start">
                            <span className="truncate max-w-[70%]">
                              {l.qty} × {l.name}{l.size && ` (${shortSizeName(l.size.name)})`}
                            </span>
                            <span className="font-semibold tabular-nums">{formatPrice(lineTotal(l))}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Datos personales */}
                    <div className="space-y-2.5 text-xs text-ink/85">
                      <p>
                        <span className="font-bold text-ink">Cliente:</span> {customer.name}
                      </p>
                      <p>
                        <span className="font-bold text-ink">Entrega:</span>{" "}
                        {customer.mode === "envio"
                          ? `A domicilio: ${customer.address}`
                          : "Paso a recoger en local"}
                      </p>
                      {customer.mode === "envio" && customer.location && (
                        <p className="text-wa-deep font-bold flex items-center gap-1">
                          <PinIcon className="h-3.5 w-3.5" /> Punto marcado en el mapa
                        </p>
                      )}
                      <p>
                        <span className="font-bold text-ink">Forma de pago:</span>{" "}
                        {selectedPayment?.label ?? "Por definir"}
                        {selectedPayment?.id === "efectivo" && customer.cashAmount && (
                          <span className="text-ink/60 font-mono"> (pago con {formatPrice(Number(customer.cashAmount))})</span>
                        )}
                      </p>
                      {customer.notes && (
                        <p className="italic">
                          <span className="font-bold text-ink">Notas:</span> “{customer.notes}”
                        </p>
                      )}
                      {couponOk && appliedCoupon && (
                        <p className="text-wa-deep font-bold">
                          <span className="text-ink">Cupón:</span> {appliedCoupon.code} ({couponLabel(appliedCoupon.coupon!)})
                        </p>
                      )}
                      {isDelivery && (
                        <p className="text-ink/75">
                          💛 <span className="font-bold text-ink">Propina:</span> lo que decidas dar va íntegro
                          para tu repartidor. ¡Gracias por tu apoyo!
                        </p>
                      )}
                      {needsCapture && (
                        <p className="text-ink/75">
                          📸 <span className="font-bold text-ink">Recuerda:</span> enviar la captura de tu pago
                          en WhatsApp para confirmar el pedido.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-mustard/15 px-3 py-2.5 text-center text-xs text-ink/80">
                    💡 ¡Todo listo! Al presionar el botón inferior se abrirá tu WhatsApp con el mensaje
                    confeccionado. Presiona enviar allá para confirmar tu pedido.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie con totales y acciones */}
        {cart.lines.length > 0 && (
          <footer className="border-t border-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            {/* Totales */}
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink/50">Total</p>
                <p className="text-[0.7rem] text-ink/50 leading-tight">
                  {customer.mode === "envio" ? "Envío: solo propina" : "Recoger en local"}
                  {selectedPayment ? ` · ${selectedPayment.label}` : ""}
                </p>
                {discount > 0 && appliedCoupon && (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[0.7rem] font-bold text-wa-deep animate-pop">
                    <TicketIcon className="h-3.5 w-3.5" />
                    {appliedCoupon.code} · −{formatPrice(discount)}
                  </p>
                )}
              </div>
              <div className="text-right">
                {discount > 0 && (
                  <p className="text-sm tabular-nums text-ink/45 line-through">{formatPrice(cart.total)}</p>
                )}
                <p className="text-3xl font-extrabold tabular-nums tracking-tight">{formatPrice(grandTotal)}</p>
              </div>
            </div>

            {/* Acciones del Wizard */}
            <div className="flex gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3.5 text-sm font-bold text-paper transition hover:opacity-90 active:scale-[0.98]"
                >
                  Siguiente: Entrega ➔
                </button>
              )}

              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full border border-ink/15 px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-paper/60 active:scale-[0.98]"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleNextToStep3}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3.5 text-sm font-bold text-paper transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Siguiente: Pago ➔
                  </button>
                </>
              )}

              {step === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border border-ink/15 px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-paper/60 active:scale-[0.98]"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleNextToStep4}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink py-3.5 text-sm font-bold text-paper transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Siguiente: Enviar ➔
                  </button>
                </>
              )}

              {step === 4 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-full border border-ink/15 px-5 py-3.5 text-sm font-bold text-ink transition hover:bg-paper/60 active:scale-[0.98]"
                  >
                    Atrás
                  </button>
                  <a
                    href={isAllValid && !closed ? href : undefined}
                    onClick={handleSend}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="button"
                    aria-disabled={!isAllValid || closed}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-bold text-white shadow-lg transition active:scale-[0.98]",
                      closed
                        ? "cursor-not-allowed bg-ink/30 shadow-none"
                        : isAllValid
                          ? "bg-wa shadow-wa/40 hover:bg-wa-deep"
                          : "cursor-pointer bg-wa/70 shadow-none hover:bg-wa/80",
                    )}
                  >
                    <WhatsAppIcon className="h-6 w-6" />
                    {closed ? "Cerrado por ahora" : "Enviar por WhatsApp"}
                  </a>
                </>
              )}
            </div>

            {/* Aviso inferior */}
            <div className="mt-3 text-center text-[0.68rem] text-ink/50 leading-normal">
              {step === 1 && "Paso 1: Revisa tus productos y detalles especiales."}
              {step === 2 && "Paso 2: Cuéntanos cómo y a quién entregamos (* Requerido)."}
              {step === 3 && "Paso 3: Elige tu método de pago y aplica cupones."}
              {step === 4 && "Paso 4: Confirma que todo esté bien antes de abrir WhatsApp."}
            </div>
          </footer>
        )}
      </aside>

      {mapOpen && (
        <LocationPicker
          initial={customer.location ?? null}
          onClose={() => setMapOpen(false)}
          onConfirm={(pointValue, addressValue) => {
            onCustomerChange({ ...customer, location: pointValue, address: addressValue });
            setMapOpen(false);
          }}
        />
      )}
    </div>
  );
}
