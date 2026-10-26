import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { CartApi } from "../hooks/useCart";
import type { CartLine, CustomerInfo, DeliveryMode, MenuItem, PaymentMethod, Settings } from "../types";
import type { AppliedCoupon } from "../utils/coupon";
import { resolveImage } from "../data/menu";
import { couponLabel } from "../utils/coupon";
import { formatPrice } from "../utils/format";
import { lineTotal, lineUnitPrice, shortSizeName } from "../utils/menu";
import { buildOrderMessage, buildWhatsAppUrl } from "../utils/whatsapp";
import { cn } from "../utils/cn";
import {
  BagIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  GlassIceIcon,
  MinusIcon,
  PinIcon,
  PencilIcon,
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

function transferClabe(details: string): string | null {
  const lines = details.split(/\r?\n/);
  const labeled = lines.filter((line) => /\bclabe\b/i.test(line));
  const candidates = [...labeled, ...lines.filter((line) => !labeled.includes(line))]
    .flatMap((line) => line.match(/(?:\d[\d\s-]?){17}\d/g) ?? [])
    .map((value) => value.replace(/\D/g, ""))
    .filter((value) => value.length === 18);

  return candidates[0] ?? null;
}

function formatClabe(clabe: string): string {
  return clabe.replace(/\D/g, "").replace(/(\d{3})(?=\d)/g, "$1 ");
}

interface TransferData {
  bank: string | null;
  holder: string | null;
  account: string | null;
  clabe: string | null;
  other: string[];
}

function parseTransferData(details: string): TransferData {
  const result: TransferData = { bank: null, holder: null, account: null, clabe: null, other: [] };

  for (const line of details.split(/\r?\n/)) {
    const cleaned = line.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    if (!cleaned) continue;

    const labeledValue = cleaned.match(/^(banco|titular|beneficiario|clabe(?:\s+interbancaria)?|cuenta|n[uú]mero de cuenta)\s*[:\-]\s*(.*)$/i);
    if (labeledValue) {
      const [, label, value] = labeledValue;
      if (/^banco$/i.test(label)) result.bank = value || null;
      else if (/^(titular|beneficiario)$/i.test(label)) result.holder = value || null;
      else if (/^clabe/i.test(label)) result.clabe = transferClabe(value) ?? (value.trim() || null);
      else result.account = value || null;
      continue;
    }

    const clabe = transferClabe(cleaned);
    if (clabe && !result.clabe) {
      result.clabe = clabe;
      continue;
    }

    result.other.push(cleaned);
  }

  return result;
}

function mercadoPagoLink(details: string): string | null {
  return details.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

function TransferDetails({
  details,
  copiedField,
  copyErrorField,
  onCopy,
}: {
  details: string;
  copiedField: string | null;
  copyErrorField: string | null;
  onCopy: (value: string, field: string) => void;
}) {
  const data = parseTransferData(details);
  const rows = [
    { id: "bank", label: "Banco", value: data.bank },
    { id: "holder", label: "Titular", value: data.holder },
    { id: "account", label: "Cuenta", value: data.account },
    { id: "clabe", label: "CLABE", value: data.clabe },
  ].filter((row): row is { id: string; label: string; value: string } => Boolean(row.value));

  if (rows.length === 0) {
    return (
      <div className="mt-3 rounded-xl border border-ink/10 bg-white p-3">
        <p className="whitespace-pre-line break-words text-sm text-ink/75">{details}</p>
        <button
          type="button"
          onClick={() => onCopy(details, "details")}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink/70 transition hover:bg-ink/5 hover:text-ink"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copiedField === "details" ? "Copiado" : "Copiar datos"}
        </button>
        {copyErrorField === "details" && (
          <p role="alert" className="mt-1 text-xs text-red-700">No se pudo copiar. Selecciona los datos y cópialos manualmente.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-ink/10 bg-white p-3">
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5">
          <div className="min-w-0">
            <span className="block text-[0.65rem] font-medium text-ink/55">{row.label}</span>
            <span className={cn(
              "mt-0.5 block min-w-0 break-words rounded-lg bg-paper/70 px-2.5 py-2 text-sm text-ink",
              row.id === "clabe" && "font-mono text-xs font-bold tracking-wide",
            )}>
              {row.id === "clabe" && row.value.length === 18 ? formatClabe(row.value) : row.value}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const value = row.id === "clabe"
                ? row.value.replace(/\D/g, "")
                : row.id === "account"
                  ? row.value.replace(/\s/g, "")
                  : row.value;
              onCopy(value, row.id);
            }}
            aria-label={copiedField === row.id ? `Copiado ${row.label.toLowerCase()}` : `Copiar ${row.label.toLowerCase()}`}
            title={copiedField === row.id ? "Copiado" : `Copiar ${row.label.toLowerCase()}`}
            className="grid h-9 w-9 place-items-center rounded-lg bg-ink/[0.04] text-ink/65 transition hover:bg-ink/10 hover:text-ink"
          >
            {copiedField === row.id ? <CheckIcon className="h-4 w-4 text-wa-deep" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
          {copyErrorField === row.id && (
            <p role="alert" className="col-span-2 text-xs text-red-700">
              No se pudo copiar. Selecciona el dato y cópialo manualmente.
            </p>
          )}
        </div>
      ))}
      {data.other.length > 0 && (
        <p className="border-t border-ink/8 pt-2 text-xs leading-relaxed text-ink/65">{data.other.join(" · ")}</p>
      )}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  onBrowseMenu: () => void;
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
  onBrowseMenu,
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
  const [sentPayment, setSentPayment] = useState<PaymentMethod | null>(null);
  const [sentTotal, setSentTotal] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyErrorField, setCopyErrorField] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const couponOk = !!appliedCoupon?.coupon && !appliedCoupon.error;
  const discount = couponOk ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cart.total - discount);
  const enteredCashAmount = customer.cashAmount.trim() ? Number(customer.cashAmount) : null;
  const cashChange =
    enteredCashAmount !== null && Number.isFinite(enteredCashAmount) && enteredCashAmount >= grandTotal
      ? enteredCashAmount - grandTotal
      : null;
  const cashShortfall =
    enteredCashAmount !== null && Number.isFinite(enteredCashAmount) && enteredCashAmount < grandTotal
      ? grandTotal - enteredCashAmount
      : null;

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const paymentRef = useRef<HTMLFieldSetElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stepRef = useRef(step);
  const historyEntryRef = useRef(false);
  const restoringHistoryRef = useRef(false);
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
      if (restoringHistoryRef.current) {
        restoringHistoryRef.current = false;
        return;
      }

      if (stepRef.current > 1) {
        const previousStep = (stepRef.current - 1) as 1 | 2 | 3 | 4;
        stepRef.current = previousStep;
        setStep(previousStep);
        restoringHistoryRef.current = true;
        window.history.forward();
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
      setSentPayment(null);
      setSentTotal(0);
    } else {
      setStep(1);
    }
  }, [cart.lines]);

  // Al cerrar o abrir el panel se reinician los estados del asistente
  useEffect(() => {
    if (!open) {
      setSent(false);
      setSentPayment(null);
      setSentTotal(0);
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
    update({ payment: "" });
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
    setSentTotal(grandTotal);
    cart.clear();
    setSentPayment(selectedPayment);
    setAttempted(false);
    setSent(true);
    onSent?.();
  };

  const copyPaymentValue = async (value: string, field: string) => {
    if (!value) return;
    setCopyErrorField(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField((current) => current === field ? null : current), 1800);
    } catch {
      setCopiedField(null);
      setCopyErrorField(field);
    }
  };

  const openMercadoPago = () => {
    const link = selectedPayment?.id === "mercadopago" ? mercadoPagoLink(selectedPayment.details) : null;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  const sentPaymentDetails = sentPayment ?? selectedPayment;
  const couponPanel = (
    <div className="rounded-xl bg-surface shadow-sm ring-1 ring-ink/8">
      <button
        type="button"
        aria-expanded={couponOpen}
        onClick={() => setCouponOpen((current) => !current)}
        className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
      >
        <TicketIcon className="h-4 w-4 shrink-0 text-terracotta" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-ink/75">
            {appliedCoupon ? "Cupón aplicado" : "¿Tienes un cupón de descuento?"}
          </span>
          {couponOk && appliedCoupon && (
            <span className="mt-0.5 block truncate text-xs font-semibold text-wa-deep">
              {appliedCoupon.code} · −{formatPrice(discount)}
            </span>
          )}
          {appliedCoupon && !couponOk && (
            <span className="mt-0.5 block truncate text-xs font-medium text-red-600">{appliedCoupon.error}</span>
          )}
        </span>
        <ChevronDownIcon className={cn("h-4 w-4 shrink-0 text-ink/55 transition-transform", couponOpen && "rotate-180")} />
      </button>

      {couponOpen && (
        <div className="animate-fade border-t border-ink/8 px-3 pb-3 pt-2.5">
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
                className={cn(inputCls, "mt-0 flex-1 border-ink/15 bg-paper/20 font-mono uppercase tracking-wider")}
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
      )}
    </div>
  );

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
        className="absolute inset-0 flex animate-fade flex-col bg-paper-light text-ink shadow-2xl md:inset-y-4 md:left-1/2 md:right-auto md:w-[calc(100%-2rem)] md:max-w-lg md:-translate-x-1/2 md:rounded-2xl md:overflow-hidden"
      >
        {/* Encabezado */}
        <header className="border-b border-ink/10 bg-mustard px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-mustard">
              <BagIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h2 id="cart-title" className="text-lg font-bold leading-tight">
                Tu pedido
              </h2>
              <p className="text-xs text-ink/70">
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
              <div className="grid grid-cols-4 gap-1 text-center text-[0.62rem] font-bold uppercase">
                {(["Pedido", "Entrega", "Pago", "Enviar"] as const).map((label, index) => {
                  const stepNumber = (index + 1) as 1 | 2 | 3 | 4;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => stepNumber < step && setStep(stepNumber)}
                      aria-current={step === stepNumber ? "step" : undefined}
                      className={cn(
                        "flex min-h-8 flex-col items-center justify-center gap-0.5 transition",
                        step === stepNumber ? "text-terracotta" : stepNumber < step ? "text-ink/70" : "text-ink/40",
                      )}
                    >
                      <span className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border text-[0.6rem]",
                        step === stepNumber ? "border-terracotta bg-terracotta text-white" : "border-current",
                      )}>
                        {stepNumber < step ? <CheckIcon className="h-3 w-3" /> : stepNumber}
                      </span>
                      {label}
                    </button>
                  );
                })}
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
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <span className="grid h-20 w-20 animate-pop place-items-center rounded-full bg-wa text-white shadow-lg shadow-wa/35">
                <CheckIcon className="h-10 w-10" />
              </span>
              <p className="mt-4 text-base font-bold">¡Pedido enviado!</p>
              {sentPaymentDetails && (sentPaymentDetails.id === "transferencia" || sentPaymentDetails.id === "mercadopago") && (
                <details className="mt-4 w-full max-w-[34ch] rounded-xl border border-ink/10 bg-ink/[0.03] text-left">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-ink/75 [&::-webkit-details-marker]:hidden">
                    <span>Información de pago</span>
                    <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 transition-transform [[open]_&]:rotate-180" />
                  </summary>
                  <div className="border-t border-ink/10 px-3 pb-3 pt-2.5 text-[0.7rem] leading-relaxed text-ink/75">
                    {sentPaymentDetails.id === "mercadopago" ? (
                      <>
                        <p className="font-semibold text-ink">Completa tu pago en Mercado Pago</p>
                        <p className="mt-1">Abre el enlace y paga <strong>{formatPrice(sentTotal)}</strong>.</p>
                        {mercadoPagoLink(sentPaymentDetails.details) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const link = mercadoPagoLink(sentPaymentDetails.details);
                              if (link) window.open(link, "_blank", "noopener,noreferrer");
                            }}
                            className="mt-2 inline-flex items-center rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                          >
                            Abrir Mercado Pago
                          </button>
                        ) : (
                          <p className="mt-1 text-red-700">El enlace de Mercado Pago aún no está configurado.</p>
                        )}
                      </>
                    ) : sentPaymentDetails.details ? (
                      <>
                        <p className="font-semibold text-ink">Datos de transferencia</p>
                        <TransferDetails
                          details={sentPaymentDetails.details}
                          copiedField={copiedField}
                          copyErrorField={copyErrorField}
                          onCopy={copyPaymentValue}
                        />
                      </>
                    ) : (
                      <p>Te enviaremos los datos para tu pago por WhatsApp.</p>
                    )}
                    <p className="mt-2 border-t border-ink/10 pt-2 text-ink/60">
                      Después de pagar, envíanos el comprobante por WhatsApp para confirmar el pedido.
                    </p>
                  </div>
                </details>
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
                        <h3 className="mb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink/55">
                            {g.title}
                        </h3>
                        <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-ink/5">
                          {g.lines.map((l) => (
                            <li key={l.key} className="flex items-center gap-1 px-2.5 py-2.5 sm:gap-3 sm:px-3">
                              {resolveImage(l.categoryImage) && (
                                <img
                                  src={resolveImage(l.categoryImage)}
                                  alt={`Imagen de ${l.categoryTitle}`}
                                  className="h-12 w-12 shrink-0 rounded-lg bg-paper object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="break-words font-semibold leading-tight">{l.name}</p>
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

                              <div className="flex items-center gap-0.5 rounded-full text-ink">
                                <button
                                  type="button"
                                  onClick={() => cart.decrementLine(l.key)}
                                  aria-label={`Quitar uno de ${l.name}`}
                                  className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 transition hover:bg-ink/10"
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

                              <span className="w-10 text-right text-sm font-bold tabular-nums sm:w-16 sm:text-base">
                                {formatPrice(lineTotal(l))}
                              </span>

                              <button
                                type="button"
                                onClick={() => cart.removeLine(l.key)}
                                aria-label={`Eliminar ${l.name}`}
                                className="grid h-7 w-7 place-items-center rounded-full text-ink/40 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onBrowseMenu}
                    className="flex w-full items-center gap-3 rounded-xl bg-mustard/15 px-3 py-2.5 text-left transition hover:bg-mustard/25"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mustard text-on-mustard">
                      <PlusIcon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold">Agregar más productos</span>
                  </button>

                  {/* Sugerencia: bebidas del día (Upsell) */}
                  {suggestions.length > 0 && (
                    <div className="rounded-2xl bg-mustard/10 ring-1 ring-mustard/30 animate-fade">
                      <button
                        type="button"
                        onClick={() => setSuggestionsOpen((current) => !current)}
                        aria-expanded={suggestionsOpen}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                      >
                        <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-ink/60">
                          <span className="flex items-center gap-2">
                            <GlassIceIcon className="h-5 w-5 text-terracotta" />
                            ¿Agregas una bebida?
                          </span>
                        </span>
                        <ChevronDownIcon className={cn("h-4 w-4 text-ink/55 transition-transform", suggestionsOpen && "rotate-180")} />
                      </button>
                      {suggestionsOpen && (
                        <ul className="space-y-1.5 px-3 pb-3">
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
                      )}
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
                  <div>
                    <h3 className="text-lg font-extrabold">Entrega</h3>
                    <p className="mt-0.5 text-xs text-ink/55">Cuéntanos cómo recibirás tu pedido.</p>
                  </div>
                  <div className="space-y-3.5 rounded-xl bg-surface p-4 shadow-sm ring-1 ring-ink/8">
                    {/* Envío o Recoger */}
                    <fieldset>
                      <legend className="text-sm font-bold text-ink">¿Cómo prefieres recibir tu pedido?</legend>
                      <div className="mt-2 grid grid-cols-2 gap-2.5">
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
                              "relative flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition sm:text-sm",
                              customer.mode === opt.value
                                ? "border-mustard bg-mustard/10 text-ink ring-1 ring-mustard"
                                : "border-ink/15 bg-white text-ink hover:border-mustard/70",
                            )}
                          >
                            <span className="text-2xl leading-none" aria-hidden="true">{opt.emoji}</span>
                            <span className="text-center">{opt.label}</span>
                            {customer.mode === opt.value && (
                              <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-mustard text-on-mustard">
                                <CheckIcon className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {customer.mode === "envio" && (
                        <p className="mt-2 rounded-lg bg-mustard/10 px-3 py-2 text-[0.7rem] text-ink/65">
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
                  <div>
                    <h3 className="text-lg font-extrabold">Forma de pago</h3>
                    <p className="mt-0.5 text-xs text-ink/55">Elige el método que prefieras.</p>
                  </div>

                  {/* Forma de pago */}
                  <div className="space-y-3.5 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-ink/5">
                    {enabledPayments.length > 0 && (
                      <fieldset ref={paymentRef}>
                        <legend className="sr-only">¿Cómo vas a pagar?</legend>
                        <div className="mt-3">
                          {enabledPayments.map((p) => (
                            <div
                              key={p.id}
                              aria-hidden={Boolean(customer.payment && customer.payment !== p.id)}
                              inert={Boolean(customer.payment && customer.payment !== p.id)}
                              className={cn(
                                "overflow-hidden transition-[max-height,opacity,transform,padding] duration-300 ease-in-out",
                                customer.payment && customer.payment !== p.id
                                  ? "pointer-events-none max-h-0 -translate-y-2 opacity-0"
                                  : "mb-2 max-h-[40rem] translate-y-0 pb-2 opacity-100",
                              )}
                            >
                              <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  update({ payment: customer.payment === p.id ? "" : p.id });
                                  setAttempted(false);
                                }}
                                aria-pressed={customer.payment === p.id}
                                aria-expanded={customer.payment === p.id}
                                aria-controls={customer.payment === p.id ? `payment-details-${p.id}` : undefined}
                                className={cn(
                                  "flex min-h-16 w-full flex-row justify-start gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-bold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                                  customer.payment === p.id
                                    ? "border-mustard bg-mustard/10 text-ink shadow-sm ring-1 ring-mustard/70"
                                    : "border-ink/10 bg-white text-ink hover:border-ink/30",
                                  attempted && errors.payment && "border-red-400",
                                )}
                              >
                                {p.id === "mercadopago" ? (
                                  <PaymentIcon id={p.id} className="w-20" />
                                ) : (
                                  <span className={cn(
                                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                                    p.id === "efectivo" ? "bg-emerald-50" : "bg-sky-100",
                                  )}>
                                    <PaymentIcon id={p.id} className="h-8 w-8" />
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block">{p.label}</span>
                                  <span className="mt-1 block text-[0.68rem] font-normal text-ink/55">
                                    {p.id === "efectivo" && "Paga cuando recibas tu pedido o al recoger."}
                                    {p.id === "transferencia" && "Realiza tu pago y envíanos el comprobante."}
                                    {p.id === "mercadopago" && "Paga en línea con tarjeta o Mercado Pago."}
                                    {p.id === "terminal" && "Paga con tarjeta en una terminal bancaria."}
                                  </span>
                                </span>
                                <span className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                  customer.payment === p.id ? "border-terracotta bg-terracotta text-white" : "border-ink/25",
                                )}>
                                  {customer.payment === p.id && <CheckIcon className="h-3 w-3" />}
                                </span>
                              </button>

                              {customer.payment === p.id && (
                                <div
                                  id={`payment-details-${p.id}`}
                                  className={cn(
                                    "animate-fade rounded-xl p-3 text-xs text-ink/80",
                                    p.id === "transferencia" ? "bg-sky-50 ring-1 ring-sky-100" : "bg-mustard/10 ring-1 ring-ink/5",
                                  )}
                                >
                                  {p.id === "efectivo" && (
                                    <label className="block">
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
                                        className={cn(inputCls, "border-ink/15 bg-white font-mono")}
                                      />
                                      {p.details && <span className="mt-1 block text-[0.7rem] text-ink/55">{p.details}</span>}
                                      {customer.cashAmount.trim() && (
                                        <p className={cn(
                                          "mt-2 rounded-lg px-3 py-2 text-xs font-semibold",
                                          cashChange !== null
                                            ? "bg-wa/10 text-wa-deep"
                                            : cashShortfall !== null
                                              ? "bg-amber-100 text-amber-900"
                                              : "bg-red-50 text-red-700",
                                        )}>
                                          {cashChange !== null
                                            ? `Tu cambio estimado: ${formatPrice(cashChange)}`
                                            : cashShortfall !== null
                                              ? `El pago no cubre el total. Faltan ${formatPrice(cashShortfall)}`
                                              : "Escribe una cantidad válida para calcular tu cambio."}
                                        </p>
                                      )}
                                    </label>
                                  )}

                                  {p.id === "terminal" && (
                                    <p className="text-xs leading-relaxed text-ink/75">
                                      {p.details.trim() || "Paga con tarjeta al recibir o recoger tu pedido."}
                                    </p>
                                  )}

                                  {p.id === "mercadopago" && (
                                    <>
                                      <div className="flex items-center gap-3">
                                        <PaymentIcon id="mercadopago" className="w-16" />
                                        <div>
                                          <p className="text-xs text-ink/60">Total a pagar</p>
                                          <p className="text-sm font-bold text-ink">{formatPrice(grandTotal)}</p>
                                        </div>
                                      </div>
                                      <p className="mt-3">Al terminar, envíanos el comprobante por WhatsApp para confirmar el pedido.</p>
                                      {mercadoPagoLink(p.details) ? (
                                        <button
                                          type="button"
                                          onClick={openMercadoPago}
                                          className="mt-2 inline-flex items-center rounded-full bg-sky-600 px-4 py-2 font-bold text-white transition hover:bg-sky-700"
                                        >
                                          Abrir Mercado Pago
                                        </button>
                                      ) : (
                                        <p role="alert" className="mt-2 text-red-700">El enlace de Mercado Pago aún no está configurado.</p>
                                      )}
                                    </>
                                  )}

                                  {p.id === "transferencia" && (
                                    <>
                                      <div className="flex items-center gap-3">
                                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
                                          <PaymentIcon id="transferencia" className="h-8 w-8" />
                                        </span>
                                        <div>
                                          <p className="text-sm font-bold text-ink">Datos de transferencia</p>
                                          <p className="mt-0.5 text-xs text-ink/60">Realiza la transferencia y envíanos el comprobante.</p>
                                        </div>
                                      </div>
                                      {p.details ? (
                                        <TransferDetails
                                          details={p.details}
                                          copiedField={copiedField}
                                          copyErrorField={copyErrorField}
                                          onCopy={copyPaymentValue}
                                        />
                                      ) : (
                                        <p className="mt-3 rounded-xl border border-sky-100 bg-white p-3 text-sm text-ink/65">
                                          Los datos de transferencia aún no están configurados.
                                        </p>
                                      )}
                                      <p className="mt-3 rounded-lg bg-sky-100/70 px-3 py-2 text-xs leading-relaxed text-sky-900">
                                        Después de pagar, envíanos el comprobante por WhatsApp para confirmar tu pedido.
                                      </p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            </div>
                          ))}
                        </div>
                        {attempted && errors.payment && (
                          <span className="mt-1.5 block text-xs font-medium text-red-600">{errors.payment}</span>
                        )}
                      </fieldset>
                    )}
                  </div>

                  {couponPanel}

                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* PASO 4: RESUMEN Y ENVIAR                                      */}
              {/* ------------------------------------------------------------- */}
              {step === 4 && (
                <div className="space-y-4 animate-fade">
                  <div>
                    <h3 className="text-lg font-extrabold">Resumen de tu pedido</h3>
                    <p className="mt-0.5 text-xs text-ink/55">Confirma que todo esté correcto.</p>
                  </div>

                  <div className="divide-y divide-ink/10 rounded-xl bg-surface px-4 shadow-sm ring-1 ring-ink/8">
                    <section className="py-3 first:pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="text-xs font-bold text-ink">Artículos ({cart.count})</h4>
                        <button type="button" onClick={() => setStep(1)} aria-label="Editar artículos" title="Editar artículos" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <ul className="space-y-2.5">
                        {cart.lines.map((l) => (
                          <li key={l.key} className="flex min-w-0 items-center gap-2.5">
                            {resolveImage(l.categoryImage) && (
                              <img
                                src={resolveImage(l.categoryImage)}
                                alt={`Imagen de ${l.categoryTitle}`}
                                className="h-11 w-11 shrink-0 rounded-lg bg-paper object-cover"
                              />
                            )}
                            <div className="min-w-0 flex-1 text-xs">
                              <p className="font-semibold text-ink">
                                {l.qty} × {l.name}{l.size && ` (${shortSizeName(l.size.name)})`}
                              </p>
                              {l.extras.length > 0 && <p className="mt-0.5 text-ink/60">{l.extras.map((extra) => extra.name).join(" · ")}</p>}
                              {(l.comboSelections?.length ?? 0) > 0 && (
                                <p className="mt-0.5 text-ink/60">{l.comboSelections?.map((selection) => selection.label).join(" · ")}</p>
                              )}
                            </div>
                            <span className="shrink-0 text-xs font-bold tabular-nums">{formatPrice(lineTotal(l))}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 text-xs">
                        <h4 className="font-bold text-ink">Cliente</h4>
                        <p className="mt-1 break-words text-ink/75">{customer.name}</p>
                      </div>
                      <button type="button" onClick={() => setStep(2)} aria-label="Editar cliente" title="Editar cliente" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </section>

                    <section className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 text-xs">
                        <h4 className="font-bold text-ink">Entrega</h4>
                        <p className="mt-1 break-words text-ink/75">
                          {customer.mode === "envio" ? `Envío a domicilio · ${customer.address}` : "Paso a recoger en local"}
                        </p>
                        {customer.mode === "envio" && customer.location && (
                          <p className="mt-1 flex items-center gap-1 font-semibold text-wa-deep">
                            <PinIcon className="h-3.5 w-3.5" /> Ubicación marcada en el mapa
                          </p>
                        )}
                        {isDelivery && <p className="mt-1 text-ink/60">Envío: solo propina</p>}
                      </div>
                      <button type="button" onClick={() => setStep(2)} aria-label="Editar entrega" title="Editar entrega" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </section>

                    <section className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 text-xs">
                        <h4 className="font-bold text-ink">Pago</h4>
                        <p className="mt-1 break-words text-ink/75">
                          {selectedPayment?.label ?? "Por definir"}
                          {selectedPayment?.id === "efectivo" && customer.cashAmount && (
                            <span className="font-mono text-ink/60"> · Pago con {formatPrice(Number(customer.cashAmount))}</span>
                          )}
                        </p>
                        {selectedPayment?.id === "efectivo" && cashChange !== null && (
                          <p className="mt-1 font-semibold text-wa-deep">Cambio para ti: {formatPrice(cashChange)}</p>
                        )}
                        {selectedPayment?.id === "efectivo" && cashShortfall !== null && (
                          <p className="mt-1 font-semibold text-amber-800">Faltan {formatPrice(cashShortfall)} para cubrir el total.</p>
                        )}
                        {needsCapture && <p className="mt-1 text-ink/60">Recuerda enviar el comprobante por WhatsApp.</p>}
                      </div>
                      <button type="button" onClick={() => setStep(3)} aria-label="Editar pago" title="Editar pago" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </section>

                    {customer.notes && (
                      <section className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0 text-xs">
                          <h4 className="font-bold text-ink">Notas</h4>
                          <p className="mt-1 break-words italic text-ink/75">“{customer.notes}”</p>
                        </div>
                        <button type="button" onClick={() => setStep(1)} aria-label="Editar notas" title="Editar notas" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </section>
                    )}

                    {couponOk && appliedCoupon && (
                      <section className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0 text-xs">
                          <h4 className="font-bold text-ink">Cupón</h4>
                          <p className="mt-1 break-words font-semibold text-wa-deep">
                            {appliedCoupon.code} · {couponLabel(appliedCoupon.coupon!)} · −{formatPrice(discount)}
                          </p>
                        </div>
                        <button type="button" onClick={() => setStep(3)} aria-label="Editar cupón" title="Editar cupón" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-terracotta transition hover:bg-terracotta/10">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </section>
                    )}
                  </div>

                  <div className="rounded-xl bg-mustard/15 px-3 py-2.5 text-center text-xs text-ink/80">
                    Al confirmar, se abrirá WhatsApp con tu pedido. Revísalo y presiona enviar para terminar.
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
                <p className="text-[0.7rem] text-ink/60 leading-tight">
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
                <p className="text-3xl font-extrabold tabular-nums">{formatPrice(grandTotal)}</p>
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
