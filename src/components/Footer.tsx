import { useState, type ReactNode } from "react";
import type { Settings } from "../types";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { cn } from "../utils/cn";
import { PaymentBadges } from "./PaymentBadges";
import {
  ChevronDownIcon,
  ClockIcon,
  FacebookIcon,
  PinIcon,
  ScooterIcon,
  WhatsAppIcon,
} from "./icons";

interface Props {
  settings: Settings;
}

function facebookHref(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://www.facebook.com/${v.replace(/^@/, "")}`;
}

function mapsHref(value: string): string | null {
  const address = value.trim();
  if (!address) return null;
  if (/^https?:\/\//i.test(address)) return address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function Footer({ settings }: Props) {
  const [open, setOpen] = useState(false);
  const whatsappHref = buildWhatsAppUrl(settings.contactMessage, settings.whatsappNumber);
  const locationHref = mapsHref(settings.address);
  const fbHref = facebookHref(settings.facebook);

  return (
    <footer className="relative z-10 mx-4 mt-10 sm:mx-8 md:mx-14 md:mt-14">
      <div className="border-y-2 border-ink">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-2 py-3 text-center text-base font-extrabold uppercase tracking-[0.16em] text-ink transition hover:text-terracotta md:py-4"
        >
          Más información
          <ChevronDownIcon className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="animate-fade border-t border-ink/15 px-3 py-4 text-sm text-ink/78 sm:px-6">
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
              <InfoLine icon={<ClockIcon className="h-4 w-4" />} label="Horario">
                {settings.hours || "Viernes a martes · 11:30 am a 5:00 pm · Miércoles y jueves cerrado"}
              </InfoLine>

              <InfoLine icon={<ScooterIcon className="h-5 w-7" />} label="Envíos">
                {settings.deliveryNote} {settings.whatsappDisplay || settings.whatsappNumber}
              </InfoLine>

              <InfoLine icon={<PinIcon className="h-4 w-4" />} label="Dirección">
                {locationHref ? (
                  <a
                    href={locationHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-ink/30 underline-offset-4 transition hover:decoration-ink"
                  >
                    {settings.address}
                  </a>
                ) : (
                  "Dirección pendiente de agregar"
                )}
              </InfoLine>

              <InfoLine icon={<FacebookIcon className="h-4 w-4 text-[#1877f2]" />} label="Facebook">
                {fbHref ? (
                  <a
                    href={fbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline decoration-ink/30 underline-offset-4 transition hover:decoration-ink"
                  >
                    {settings.facebook}
                  </a>
                ) : (
                  "Próximamente"
                )}
              </InfoLine>
            </div>

            <PaymentBadges payments={settings.payments} className="mt-4" />

            <div className="mt-4 flex justify-center">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-surface/60 px-4 py-2 text-sm font-semibold text-ink transition hover:border-wa hover:bg-surface"
              >
                <WhatsAppIcon className="h-5 w-5 text-wa" />
                Escríbenos por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}

function InfoLine({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-surface/45 p-3 ring-1 ring-ink/8">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-paper text-ink/65">
        {icon}
      </span>
      <p className="min-w-0 leading-relaxed">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ink/45">
          {label}
        </span>
        <span className="break-words font-medium text-ink/78">{children}</span>
      </p>
    </div>
  );
}