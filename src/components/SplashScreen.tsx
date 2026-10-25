import { useState } from "react";
import type { Settings } from "../types";
import { getNextOpeningInfo } from "../utils/businessSchedule";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { Blob } from "./Blob";
import { BrandLogo } from "./SombreroLogo";
import { BagIcon, CloseIcon, CopyIcon, EyeIcon, LockIcon, WhatsAppIcon } from "./icons";
import { PaymentIcon } from "./PaymentBadges";

interface Props {
  settings: Settings;
  isOpen: boolean;
  authed: boolean;
  isLoading: boolean;
  onEnter: () => void;
  onAdminEnter: () => void;
  onSecret: () => void;
}

/**
 * Portada: solo el logo sobre el fondo del menú, con el estado
 * abierto/cerrado y el acceso oculto a administración abajo.
 */
export function SplashScreen({ settings, isOpen, authed, isLoading, onEnter, onAdminEnter, onSecret }: Props) {
  const href = buildWhatsAppUrl(settings.contactMessage, settings.whatsappNumber);
  const nextOpening = getNextOpeningInfo(settings.schedule);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [clabeCopyFeedback, setClabeCopyFeedback] = useState<"copied" | "error" | null>(null);
  const paymentMethods = settings.payments.filter(
    (payment) => payment.enabled && payment.id !== "efectivo",
  );
  const copyClabe = async (clabe: string) => {
    try {
      await navigator.clipboard.writeText(clabe);
      setClabeCopyFeedback("copied");
      window.setTimeout(() => setClabeCopyFeedback(null), 2000);
    } catch {
      setClabeCopyFeedback("error");
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
                onClick={() => setShowPaymentOptions(true)}
                className="mt-2 inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-ink/55 underline underline-offset-4 transition hover:text-ink"
              >
                Realizar un pago
              </button>
            )}
          </>
        ) : (
          <>
          <div className="mt-6 w-full max-w-sm rounded-2xl border border-dashed border-red-300 bg-red-50/70 p-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-bold text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
              Cerrado por ahora
            </span>
            {settings.closedNote && (
              <p className="mt-2.5 text-sm leading-relaxed text-ink/70">{settings.closedNote}</p>
            )}
            {nextOpening && (
              <div className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-sm text-ink/75 ring-1 ring-red-200/70">
                <p className="font-bold text-ink">
                  Abrimos {nextOpening.isToday ? "hoy" : `el ${nextOpening.day}`} a las {nextOpening.open}
                </p>
                <p className="mt-0.5 text-xs text-ink/60">
                  Horario: {nextOpening.open} a {nextOpening.close}
                </p>
              </div>
            )}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-wa"
            >
              <WhatsAppIcon className="h-4 w-4 text-wa" />
              Escríbenos por WhatsApp
            </a>
          </div>
          <button
            type="button"
            onClick={onEnter}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-6 py-3 text-sm font-bold text-ink transition hover:border-ink/50 hover:bg-paper/60 active:scale-[0.98]"
          >
            <EyeIcon className="h-4 w-4" />
            Ver el menú (solo consulta)
          </button>
          </>
        )}

        {showPaymentOptions && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setShowPaymentOptions(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-options-title"
              className="w-full max-w-md rounded-2xl bg-surface p-5 text-left shadow-2xl sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/50">Opciones de pago</p>
                  <h2 id="payment-options-title" className="mt-1 text-xl font-black text-ink">Realizar un pago</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentOptions(false)}
                  aria-label="Cerrar opciones de pago"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {paymentMethods.map((payment) => {
                  const mercadoPagoLink = payment.id === "mercadopago"
                    ? payment.details.match(/https?:\/\/[^\s]+/i)?.[0]?.replace(/[),.;]+$/, "")
                    : null;
                  const transferLines = payment.details.split(/\r?\n/);
                  const clabeLines = transferLines.filter((line) => /\bclabe\b/i.test(line));
                  const clabe = [...clabeLines, ...transferLines.filter((line) => !clabeLines.includes(line))]
                    .flatMap((line) => line.match(/(?:\d[\d\s-]?){17}\d/g) ?? [])
                    .map((value) => value.replace(/\D/g, ""))
                    .find((value) => value.length === 18);

                  return (
                    <article key={payment.id} className="rounded-xl border border-ink/10 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <PaymentIcon id={payment.id} className="h-9 w-9" />
                        <h3 className="font-bold text-ink">{payment.label}</h3>
                      </div>
                      {payment.details.trim() ? (
                        <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-ink/75">
                          {payment.details}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-ink/60">
                          Solicita los datos de pago directamente al negocio.
                        </p>
                      )}
                      {payment.id === "transferencia" && clabe && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => void copyClabe(clabe)}
                            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-surface px-3.5 py-2 text-sm font-bold text-ink transition hover:border-ink/40"
                          >
                            <CopyIcon className="h-4 w-4" />
                            {clabeCopyFeedback === "copied" ? "CLABE copiada" : "Copiar CLABE"}
                          </button>
                          {clabeCopyFeedback === "error" && (
                            <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                              No se pudo copiar. Selecciona y copia la CLABE manualmente.
                            </p>
                          )}
                        </div>
                      )}
                      {mercadoPagoLink && (
                        <a
                          href={mercadoPagoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                        >
                          Abrir Mercado Pago
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {authed && (
          <button
            type="button"
            onClick={onAdminEnter}
            className="mt-5 text-xs font-semibold text-ink/50 underline underline-offset-4 transition hover:text-ink"
          >
            Entrar en modo administrador
          </button>
        )}
      </main>

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
