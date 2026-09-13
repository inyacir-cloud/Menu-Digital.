import { useState } from "react";
import type { Coupon } from "../types";
import { couponConditions, isExpired } from "../utils/coupon";
import { BellIcon, CloseIcon, GlassIceIcon, TacoIcon, TicketIcon } from "./icons";

export interface MenuNotification {
  id: string;
  kind: "coupon" | "combo" | "water";
  title: string;
  description: string;
  code?: string;
}

interface Props {
  notifications: MenuNotification[];
  onUseCoupon: (code: string) => void;
  onGoToCombos: () => void;
  onGoToWater: () => void;
}

export function NotificationCenter({ notifications, onUseCoupon, onGoToCombos, onGoToWater }: Props) {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const visible = notifications;

  return (
    <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setHasUnread(false);
        }}
        aria-label={`Notificaciones${hasUnread && visible.length ? `, ${visible.length} nuevas` : ""}`}
        aria-expanded={open}
        className="relative grid h-12 w-12 place-items-center rounded-full border-2 border-ink/15 bg-paper/95 text-ink shadow-lg backdrop-blur transition hover:scale-105"
      >
        <BellIcon className="h-5 w-5 animate-bell-vibration" />
        {hasUnread && visible.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[0.65rem] font-bold text-white">
            {visible.length > 9 ? "9+" : visible.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-2xl animate-slide-left">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <div>
              <h2 className="font-display text-lg text-ink">Novedades</h2>
              <p className="text-xs text-ink/55">Cupones y combos disponibles</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar notificaciones" className="grid h-8 w-8 place-items-center rounded-full text-ink/60 hover:bg-ink/5">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[min(28rem,65vh)] overflow-y-auto p-2">
            {visible.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-ink/55">No hay novedades por ahora.</p>
            ) : (
              visible.map((notification) => (
                <article key={notification.id} className="relative rounded-xl p-3 pr-10 transition hover:bg-paper/70">
                  <div className="flex gap-3">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${notification.kind === "coupon" ? "bg-mustard/25 text-mustard-ink" : "bg-emerald-100 text-emerald-700"}`}>
                      {notification.kind === "coupon" ? (
                        <TicketIcon className="h-4.5 w-4.5" />
                      ) : notification.kind === "water" ? (
                        <GlassIceIcon className="h-4.5 w-4.5" />
                      ) : (
                        <TacoIcon className="h-4.5 w-4.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink">{notification.title}</h3>
                      <p className="mt-0.5 text-sm leading-snug text-ink/65">{notification.description}</p>
                      {notification.kind === "coupon" ? (
                        <button type="button" onClick={() => onUseCoupon(notification.code ?? "")} className="mt-2 rounded-full bg-mustard px-3 py-1.5 text-xs font-bold text-on-mustard transition hover:bg-mustard-deep">
                          Usar cupón
                        </button>
                      ) : notification.kind === "water" ? (
                        <button type="button" onClick={() => { setOpen(false); onGoToWater(); }} className="mt-2 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-sky-600">
                          Ver aguas del día
                        </button>
                      ) : (
                        <button type="button" onClick={onGoToCombos} className="mt-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700">
                          Ver combos
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function makeCouponNotification(coupon: Coupon): MenuNotification | null {
  if (coupon.visibility !== "public" || !coupon.enabled || isExpired(coupon)) return null;
  return {
    id: `coupon-${coupon.id}`,
    kind: "coupon",
    title: `Cupón ${coupon.code}`,
    description: couponConditions(coupon),
    code: coupon.code,
  };
}