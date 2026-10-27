import { useState } from "react";
import packageJson from "../../package.json";
import type { Settings } from "../types";
import { getNextOpeningInfo } from "../utils/businessSchedule";
import { formatClabe, mercadoPagoLink, parseTransferData } from "../utils/payment";
import { Blob } from "./Blob";
import { BrandLogo } from "./SombreroLogo";
import { BankIcon, BagIcon, ChevronDownIcon, CloseIcon, CopyIcon, EyeIcon, LockIcon } from "./icons";
import { PaymentIcon } from "./PaymentBadges";

interface Props {
  settings: Settings;
  isOpen: boolean;
  isLoading: boolean;
  onEnter: () => void;
  onSecret: () => void;
}

/**
 * Portada: solo el logo sobre el fondo del menú, con el estado
 * abierto/cerrado y el acceso oculto a administración abajo.
 */
export function SplashScreen({ settings, isOpen, isLoading, onEnter, onSecret }: Props) {
  const nextOpening = getNextOpeningInfo(settings.schedule);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState<"mercadopago" | "transferencia" | null>(null);
  const [copiedPaymentField, setCopiedPaymentField] = useState<string | null>(null);
  const [paymentCopyError, setPaymentCopyError] = useState<string | null>(null);
  const paymentMethods = settings.payments.filter(
    (payment) => payment.enabled && (payment.id === "mercadopago" || payment.id === "transferencia"),
  ).sort((a, b) => a.id === "mercadopago" ? -1 : 1);
  const openPaymentOptions = () => {
    setExpandedPayment(null);
    setCopiedPaymentField(null);
    setPaymentCopyError(null);
    setShowPaymentOptions(true);
  };
  const closePaymentOptions = () => {
    setShowPaymentOptions(false);
    setExpandedPayment(null);
  };
  const copyPaymentValue = async (value: string, field: string) => {
    if (!value) return;
    setPaymentCopyError(null);
    try {
      await navigator.clipboard.writeText(value);
      setCopiedPaymentField(field);
      window.setTimeout(() => setCopiedPaymentField((current) => current === field ? null : current), 1800);
    } catch {
      setCopiedPaymentField(null);
      setPaymentCopyError(field);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-paper">
      <Blob className="absolute left-0 top-0 w-[72vw] max-w-[430px]" />
      <Blob flip className="absolute bottom-0 right-0 w-[62vw] max-w-[390px]" />
      <div className="paper-grain" aria-hidden="true" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <BrandLogo
          name={settings.name}
          tagline={settings.tagline}
          logo={settings.logo}
          onSecret={onSecret}
          className="w-80 sm:w-[26rem]"
        />

        {isLoading ? (
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-surface/80 px-5 py-2.5 text-sm font-semibold text-ink/65 ring-1 ring-ink/10">
            <span className="h-2 w-2 animate-pulse rounded-full bg-mustard" aria-hidden="true" />
            Cargando menú…
          </div>
        ) : isOpen ? (
          <>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-wa/15 px-4 py-1.5 text-sm font-bold text-wa-deep ring-1 ring-wa/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-wa" aria-hidden="true" />
              Abierto ahora
            </span>
            <button
              type="button"
              onClick={onEnter}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-6 py-3 text-sm font-bold text-ink transition hover:border-ink/50 hover:bg-paper/60 active:scale-[0.98]"
            >
              <BagIcon className="h-5 w-5" />
              Ver el menú
            </button>
            {paymentMethods.length > 0 && (
              <button
                type="button"
                onClick={openPaymentOptions}
                className="mt-2 inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-ink/55 underline underline-offset-4 transition hover:text-ink"
              >
                Realizar un pago
              </button>
            )}
          </>
        ) : (
          <>
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-dashed border-red-300 bg-red-50/70 p-4">
            <details>
              <summary className="mx-auto inline-flex cursor-pointer list-none items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-bold text-red-700 [&::-webkit-details-marker]:hidden">
                <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                Cerrado por ahora
                <ChevronDownIcon className="h-4 w-4 transition-transform [[open]_&]:rotate-180" />
              </summary>
              <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-ink/75 ring-1 ring-red-200/70">
                {nextOpening ? (
                  <>
                    <p className="font-bold text-ink">
                      Abrimos {nextOpening.isToday ? "hoy" : `el ${nextOpening.day}`} a las {nextOpening.open}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/60">
                      Horario: {nextOpening.open} a {nextOpening.close}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-ink/60">No hay horarios disponibles.</p>
                )}
              </div>
            </details>
            {settings.closedNote && (
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{settings.closedNote}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEnter}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-6 py-3 text-sm font-bold text-ink transition hover:border-ink/50 hover:bg-paper/60 active:scale-[0.98]"
          >
            <EyeIcon className="h-4 w-4" />
            Ver el menú (solo consulta)
          </button>
          {paymentMethods.length > 0 && (
            <button
              type="button"
              onClick={openPaymentOptions}
              className="mt-2 inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-ink/55 underline underline-offset-4 transition hover:text-ink"
            >
              Realizar un pago
            </button>
          )}
          </>
        )}

        {showPaymentOptions && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-3 sm:p-5"
            onClick={(event) => {
              if (event.target === event.currentTarget) closePaymentOptions();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-options-title"
              className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-4 text-left shadow-2xl shadow-black/25 sm:max-h-[calc(100dvh-2.5rem)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="payment-options-title" className="text-xl font-black tracking-tight text-ink sm:text-2xl">Realizar un pago</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">Elige tu método de pago para confirmar tu pedido</p>
                </div>
                <button
                  type="button"
                  onClick={closePaymentOptions}
                  aria-label="Cerrar opciones de pago"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {paymentMethods.map((payment) => {
                  const isMercadoPago = payment.id === "mercadopago";
                  const isExpanded = expandedPayment === payment.id;
                  const panelId = `public-payment-details-${payment.id}`;
                  const link = isMercadoPago ? mercadoPagoLink(payment.details) : null;
                  const transferData = isMercadoPago ? null : parseTransferData(payment.details);
                  const extraPaymentDetails = isMercadoPago
                    ? payment.details.replace(link ?? "", "").trim()
                    : "";
                  return (
                    <article
                      key={payment.id}
                      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors duration-300 ${
                        isExpanded
                          ? isMercadoPago ? "border-sky-300 bg-sky-50/40" : "border-amber-300 bg-amber-50/40"
                          : "border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
                        className="flex min-h-[76px] w-full items-center gap-3 px-3.5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/30 sm:px-4"
                      >
                        {isMercadoPago ? (
                          <PaymentIcon id={payment.id} className="w-12 shrink-0 sm:w-14" />
                        ) : (
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                            <BankIcon className="h-6 w-6" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold text-ink">
                            {isMercadoPago ? payment.label : "Transferencia bancaria"}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink/60">
                            {isMercadoPago
                              ? "Paga en línea de forma segura con tarjeta, saldo o efectivo."
                              : "Realiza tu pago desde tu aplicación bancaria."}
                          </span>
                        </span>
                        <ChevronDownIcon className={`h-5 w-5 shrink-0 text-ink/55 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      <div
                        id={panelId}
                        aria-hidden={!isExpanded}
                        inert={!isExpanded}
                        data-open={isExpanded}
                        className="payment-accordion-panel"
                      >
                        <div className="payment-accordion-inner">
                          <div className={`px-3.5 pb-4 sm:px-4 ${isMercadoPago ? "text-sky-950" : "text-amber-950"}`}>
                            {isMercadoPago ? (
                              <div className="border-t border-sky-200/80 pt-3">
                                <p className="text-sm leading-relaxed text-ink/70">
                                  Completa tu pago en línea con el método que prefieras. Tu pedido se confirma al finalizar.
                                </p>
                                {extraPaymentDetails && (
                                  <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-ink/60">
                                    {extraPaymentDetails}
                                  </p>
                                )}
                                {link ? (
                                  <>
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                                    >
                                      Abrir Mercado Pago
                                      <span aria-hidden="true">↗</span>
                                    </a>
                                    <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-sky-200 bg-white/80 p-2">
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="min-w-0 flex-1 break-all text-xs leading-relaxed text-ink/65 underline decoration-sky-300 underline-offset-2"
                                      >
                                        {link}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => void copyPaymentValue(link, "mercadopago-link")}
                                        aria-label="Copiar enlace de Mercado Pago"
                                        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-100 text-sky-700 transition hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                      >
                                        <CopyIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <p aria-live="polite" className="mt-1 min-h-4 text-[0.68rem] text-ink/55">
                                      {copiedPaymentField === "mercadopago-link" ? "Copiado" : "También puedes copiar el enlace y abrirlo en tu navegador."}
                                    </p>
                                    {paymentCopyError === "mercadopago-link" && (
                                      <p role="alert" className="mt-1 text-xs font-semibold text-red-700">No se pudo copiar el enlace. Selecciónalo y cópialo manualmente.</p>
                                    )}
                                  </>
                                ) : (
                                  <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                                    El enlace de Mercado Pago aún no está configurado.
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="border-t border-amber-200/80 pt-3">
                                {transferData && (
                                  <>
                                    {[
                                      { id: "bank", label: "Banco", value: transferData.bank },
                                      { id: "holder", label: "Titular", value: transferData.holder },
                                      { id: "account", label: "Cuenta", value: transferData.account },
                                      { id: "clabe", label: "CLABE", value: transferData.clabe },
                                    ].filter((row): row is { id: string; label: string; value: string } => Boolean(row.value))
                                      .map((row) => {
                                        const copyValue = row.id === "clabe" && row.value.length === 18
                                          ? row.value.replace(/\D/g, "")
                                          : row.value;
                                        const formattedValue = row.id === "clabe" && row.value.replace(/\D/g, "").length === 18
                                          ? formatClabe(row.value)
                                          : row.value;
                                        return (
                                          <div key={row.id} className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-amber-100 bg-white/85 p-2.5">
                                            <div className="min-w-0">
                                              <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-ink/50">{row.label}</span>
                                              <span className={`mt-0.5 block break-words text-sm font-bold text-ink ${row.id === "clabe" ? "font-mono text-xs tracking-wide" : ""}`}>
                                                {formattedValue}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => void copyPaymentValue(copyValue, `transfer-${row.id}`)}
                                              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-paper/70 px-2.5 text-xs font-bold text-ink/75 transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                            >
                                              <CopyIcon className="h-3.5 w-3.5" />
                                              {copiedPaymentField === `transfer-${row.id}` ? "Copiado" : "Copiar"}
                                            </button>
                                            {paymentCopyError === `transfer-${row.id}` && (
                                              <p role="alert" className="col-span-2 text-xs font-semibold text-red-700">No se pudo copiar este dato. Selecciónalo y cópialo manualmente.</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    {transferData.other.map((detail, index) => (
                                      <p key={`${index}-${detail}`} className="mb-2 whitespace-pre-line break-words text-xs leading-relaxed text-ink/65">
                                        {detail}
                                      </p>
                                    ))}
                                  </>
                                )}
                                <p className="mt-2 rounded-xl bg-amber-100/70 px-3 py-2.5 text-sm leading-relaxed text-amber-950">
                                  Realiza tu transferencia desde tu aplicación bancaria.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/50">
                <LockIcon className="h-3.5 w-3.5" />
                Realiza tus pagos de forma segura
              </p>
            </section>
          </div>
        )}

      </main>

      <p className="relative z-10 pb-3 text-center text-[0.65rem] text-ink/45">
        Versión {packageJson.version}
      </p>

      {/* Acceso oculto a administración (abajo, esquina izquierda) */}
      <button
        type="button"
        onClick={onSecret}
        aria-label="Acceso administrador"
        title="Administrar"
        className="absolute bottom-0 left-0 z-20 grid h-12 w-12 place-items-center rounded-tr-2xl text-ink/60 opacity-0 transition hover:opacity-100 focus-visible:opacity-100"
      >
        <LockIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
