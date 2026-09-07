import type { Settings } from "../types";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { Blob } from "./Blob";
import { BrandLogo } from "./SombreroLogo";
import { BagIcon, EyeIcon, LockIcon, WhatsAppIcon } from "./icons";

interface Props {
  settings: Settings;
  authed: boolean;
  onEnter: () => void;
  onSecret: () => void;
}

/**
 * Portada: solo el logo sobre el fondo del menú, con el estado
 * abierto/cerrado y el acceso oculto a administración abajo.
 */
export function SplashScreen({ settings, authed, onEnter, onSecret }: Props) {
  const href = buildWhatsAppUrl(settings.contactMessage, settings.whatsappNumber);

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
          className="w-64 sm:w-80"
        />

        {settings.open ? (
          <>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-wa/15 px-4 py-1.5 text-sm font-bold text-wa-deep ring-1 ring-wa/30">
              <span className="h-2 w-2 animate-pulse rounded-full bg-wa" aria-hidden="true" />
              Abierto ahora
            </span>
            <button
              type="button"
              onClick={onEnter}
              className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-ink px-8 py-3.5 text-base font-bold text-paper shadow-lg transition hover:opacity-90 active:scale-[0.98]"
            >
              <BagIcon className="h-5 w-5" />
              Ver el menú
            </button>
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

        {authed && (
          <button
            type="button"
            onClick={onEnter}
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
