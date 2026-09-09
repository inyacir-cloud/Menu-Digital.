import { useState } from "react";
import type { Coupon, CouponType } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { formatPrice } from "../../utils/format";
import { couponLabel, isExpired } from "../../utils/coupon";
import { cn } from "../../utils/cn";
import { PencilIcon, PercentIcon, PlusIcon, TicketIcon, TrashIcon } from "../icons";
import { Button, Card, Field, IconBtn, SectionTitle, Segmented, Switch, TextInput } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

interface Draft {
  id: string | null;
  code: string;
  type: CouponType;
  visibility: "public" | "private";
  value: string;
  maxUses: string;
  minOrder: string;
  expiresAt: string;
}

const EMPTY: Draft = { id: null, code: "", type: "percent", visibility: "public", value: "10", maxUses: "0", minOrder: "", expiresAt: "" };



export function CouponEditor({ store, notify }: Props) {
  const coupons = store.coupons;
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<{ code?: string; value?: string }>({});

  const activos = coupons.filter((c) => c.enabled && !isExpired(c)).length;
  const canjeados = coupons.reduce((sum, c) => sum + c.used, 0);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const startEdit = (c: Coupon) =>
    setDraft({
      id: c.id,
      code: c.code,
      type: c.type,
      visibility: c.visibility,
      value: String(c.value),
      maxUses: String(c.maxUses),
      minOrder: c.minOrder ? String(c.minOrder) : "",
      expiresAt: c.expiresAt ?? "",
    });

  const save = () => {
    const code = draft.code.trim();
    const value = Number(draft.value.replace(",", "."));
    const maxUses = Math.max(0, Math.round(Number(draft.maxUses) || 0));
    const minOrder = draft.minOrder.trim() === "" ? 0 : Math.max(0, Number(draft.minOrder) || 0);
    const errs: { code?: string; value?: string } = {};
    if (!code) errs.code = "Escribe el código del cupón";
    else if (coupons.some((c) => c.code === code && c.id !== draft.id))
      errs.code = "Ya existe un cupón con ese código";
    if (!Number.isFinite(value) || value <= 0) errs.value = "Debe ser mayor a 0";
    else if (draft.type === "percent" && value > 100) errs.value = "El porcentaje máximo es 100";
    setErrors(errs);
    if (errs.code || errs.value) return;

    const payload = {
      code,
      type: draft.type,
      visibility: draft.visibility,
      value: Math.round(value * 100) / 100,
      maxUses,
      minOrder: minOrder > 0 ? minOrder : undefined,
      expiresAt: draft.expiresAt || undefined,
    };

    if (draft.id) {
      store.updateCoupon(draft.id, payload);
      notify(`Cupón ${code} actualizado`);
    } else {
      store.addCoupon({ ...payload, enabled: true });
      notify(`Cupón ${code} creado y activo`);
    }
    setDraft(EMPTY);
  };

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-terracotta text-white">
            <TicketIcon className="h-4 w-4" />
          </span>
          Cupones de descuento
        </SectionTitle>
        <p className="mt-1 text-sm text-ink/60">
          Crea códigos que el cliente aplica en el carrito. Define el descuento (% o pesos), el{" "}
          <strong>máximo de cupones</strong> (cuántas veces se puede usar en total), vigencia y pedido
          mínimo.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex items-center gap-3 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-wa/15 text-wa-deep">
            <TicketIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold leading-none tabular-nums">{activos}</p>
            <p className="text-xs text-ink/55">activos ahora</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mustard/20 text-mustard-ink">
            <PercentIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold leading-none tabular-nums">{canjeados}</p>
            <p className="text-xs text-ink/55">canjes en total</p>
          </div>
        </Card>
      </div>

      {/* Formulario */}
      <Card className="space-y-3">
        <h4 className="font-bold">{draft.id ? `Editando ${draft.code}` : "Nuevo cupón"}</h4>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Código *" error={errors.code} hint="El cliente lo escribe tal cual en el carrito">
            {/* INPUT OPTIMIZADO PARA MÓVILES (evita saltos de cursor y facilita combinar letras/números) */}
            <input
              type="text"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              value={draft.code}
              onChange={(e) => {
                set({ code: e.target.value.toUpperCase() });
                setErrors((er) => ({ ...er, code: undefined }));
              }}
              placeholder="Ej. BIENVENIDA10"
              className={cn(
                "w-full rounded-xl border border-ink/15 bg-paper/40 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-ink focus:bg-white focus:ring-2 focus:ring-mustard/40 font-mono uppercase tracking-wider",
                errors.code && "border-red-400"
              )}
            />
          </Field>
          <Field label="Tipo de descuento" plain>
            <Segmented
              value={draft.type}
              onChange={(t) => set({ type: t })}
              options={[
                { value: "percent", label: "Porcentaje %" },
                { value: "monto", label: "Pesos $" },
              ]}
            />
          </Field>
          <Field label="Visibilidad" hint="Los privados no aparecen en la campana" plain>
            <Segmented
              value={draft.visibility}
              onChange={(visibility) => set({ visibility: visibility as Draft["visibility"] })}
              options={[
                { value: "public", label: "Público" },
                { value: "private", label: "Privado" },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={draft.type === "percent" ? "% de descuento *" : "Pesos de descuento *"} error={errors.value}>
            <TextInput
              value={draft.value}
              onChange={(e) => {
                set({ value: e.target.value });
                setErrors((er) => ({ ...er, value: undefined }));
              }}
              inputMode="decimal"
              invalid={!!errors.value}
            />
          </Field>
          <Field label="Máximo de usos" hint="0 = sin límite">
            <TextInput
              value={draft.maxUses}
              onChange={(e) => set({ maxUses: e.target.value.replace(/\D/g, "") })}
              inputMode="numeric"
            />
          </Field>
          <Field label="Pedido mínimo" hint="Opcional, en pesos">
            <TextInput
              value={draft.minOrder}
              onChange={(e) => set({ minOrder: e.target.value.replace(/[^\d.]/g, "") })}
              inputMode="decimal"
              placeholder="0"
            />
          </Field>
          <Field label="Vence el" hint="Opcional">
            <TextInput
              type="date"
              value={draft.expiresAt}
              onChange={(e) => set({ expiresAt: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {draft.id && (
            <Button variant="ghost" onClick={() => setDraft(EMPTY)}>
              Cancelar edición
            </Button>
          )}
          <Button onClick={save} icon={<PlusIcon className="h-4 w-4" />}>
            {draft.id ? "Guardar cambios" : "Crear cupón"}
          </Button>
        </div>
      </Card>

      {/* Lista */}
      <Card>
        <h4 className="font-bold">
          Cupones <span className="text-sm font-normal text-ink/50">({coupons.length})</span>
        </h4>

        {coupons.length === 0 && (
          <p className="mt-2 text-sm text-ink/55">
            Aún no hay cupones. Crea el primero arriba, por ejemplo{" "}
            <span className="font-mono font-semibold">BIENVENIDA10</span>: 10% de descuento.
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {coupons.map((c) => {
            const expired = isExpired(c);
            const agotado = c.maxUses > 0 && c.used >= c.maxUses;
            return (
              <li
                key={c.id}
                className={cn(
                  "rounded-xl bg-paper/60 p-3 ring-1 ring-ink/6",
                  (!c.enabled || expired || agotado) && "opacity-70",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={c.enabled}
                    onChange={(v) => {
                      store.updateCoupon(c.id, { enabled: v });
                      notify(v ? `Cupón ${c.code} activado` : `Cupón ${c.code} pausado`);
                    }}
                    label={`${c.enabled ? "Pausar" : "Activar"} cupón ${c.code}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-sm font-extrabold tracking-wide text-ink">{c.code}</span>
                      <span className="rounded-full bg-mustard/30 px-2 py-0.5 text-[0.65rem] font-bold text-ink/80">
                        {couponLabel(c)}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-bold", c.visibility === "public" ? "bg-emerald-100 text-emerald-700" : "bg-ink/10 text-ink/65")}>
                        {c.visibility === "public" ? "Público" : "Privado"}
                      </span>
                      {expired && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-red-700">
                          Expirado
                        </span>
                      )}
                      {agotado && !expired && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-red-700">
                          Usos agotados
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.72rem] text-ink/55">
                      {c.maxUses > 0
                        ? `${c.used} de ${c.maxUses} usos · quedan ${Math.max(0, c.maxUses - c.used)}`
                        : `${c.used} usos · sin límite`}
                      {c.minOrder ? ` · pedido mínimo ${formatPrice(c.minOrder)}` : ""}
                      {c.expiresAt
                        ? ` · vence ${new Date(`${c.expiresAt}T12:00:00`).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                    {c.maxUses > 0 && (
                      <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-ink/10">
                        <div
                          className={cn("h-full rounded-full transition-all", agotado ? "bg-red-400" : "bg-wa")}
                          style={{ width: `${Math.min(100, (c.used / c.maxUses) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <IconBtn label="Editar cupón" onClick={() => startEdit(c)}>
                      <PencilIcon />
                    </IconBtn>
                    <IconBtn
                      label="Eliminar cupón"
                      danger
                      onClick={() => {
                        if (window.confirm(`¿Eliminar el cupón ${c.code}?`)) {
                          store.removeCoupon(c.id);
                          notify(`Cupón ${c.code} eliminado`);
                        }
                      }}
                    >
                      <TrashIcon />
                    </IconBtn>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 text-[0.7rem] leading-relaxed text-ink/50">
          Cada pedido enviado con el cupón suma un uso automáticamente. Cuando llega al máximo, el cupón
          deja de aplicar y se marca como “Usos agotados”.
        </p>
      </Card>
    </div>
  );
}
