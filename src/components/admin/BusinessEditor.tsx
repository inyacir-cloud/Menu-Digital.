import { useMemo, useState } from "react";
import type { BusinessDayName, BusinessSchedule, PaymentId, PaymentMethod, Settings } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { DEFAULT_BUSINESS_SCHEDULE } from "../../utils/businessSchedule";
import { cn } from "../../utils/cn";
import { PaymentIcon } from "../PaymentBadges";
import { Button, Card, Field, SaveBar, SectionTitle, TextArea, TextInput, Toggle, Segmented } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

const PAYMENT_HINTS: Record<PaymentId, string> = {
  efectivo: "Opcional. Ej. “Procura traer cambio” o “Aceptamos billetes de $500”.",
  transferencia: "Banco, CLABE y nombre del titular. El cliente los verá al elegir este método.",
  mercadopago: "Pega únicamente el link de cobro de Mercado Pago; el cliente lo abrirá para pagar el total.",
};

const DAY_LABELS: Record<BusinessDayName, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const EMPTY_RANGE = { open: "11:30", close: "21:00" };

export function BusinessEditor({ store, notify }: Props) {
  const [form, setForm] = useState<Settings>(() => ({
    ...store.settings,
    schedule: { ...DEFAULT_BUSINESS_SCHEDULE, ...(store.settings.schedule ?? {}) },
  }));
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(store.settings);

  const scheduleEntries = useMemo(() => Object.entries(DAY_LABELS) as Array<[BusinessDayName, string]>, []);

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));
  const setPayment = (id: PaymentId, patch: Partial<PaymentMethod>) =>
    setForm((f) => ({ ...f, payments: f.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

  const setDay = (day: BusinessDayName, patch: Partial<BusinessSchedule[BusinessDayName]>) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          enabled: f.schedule[day]?.enabled ?? true,
          ranges: f.schedule[day]?.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges,
          ...patch,
        },
      },
    }));
  };

  const setRange = (day: BusinessDayName, index: number, patch: Partial<{ open: string; close: string }>) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ranges: (f.schedule[day]?.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges).map((range, rangeIndex) =>
            rangeIndex === index ? { ...range, ...patch } : range,
          ),
        },
      },
    }));
  };

  const addRange = (day: BusinessDayName) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ranges: [...(f.schedule[day]?.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges), { ...EMPTY_RANGE }],
        },
      },
    }));
  };

  const removeRange = (day: BusinessDayName, index: number) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ranges: (f.schedule[day]?.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges).filter((_, rangeIndex) => rangeIndex !== index),
        },
      },
    }));
  };

  const save = () => {
    const digits = form.whatsappNumber.replace(/\D/g, "");
    if (!form.name.trim()) {
      setError("El nombre del negocio es obligatorio");
      return;
    }
    if (digits.length < 10) {
      setError("El número de WhatsApp debe tener al menos 10 dígitos e incluir la lada internacional (52 para México)");
      return;
    }
    setError(null);
    store.updateSettings({
      ...form,
      name: form.name.trim(),
      whatsappNumber: digits,
      whatsappDisplay: form.whatsappDisplay.trim() || digits,
    });
    notify("Datos del negocio guardados");
  };

  return (
    <div className="space-y-5 pb-24">
      <div>
        <SectionTitle>Información del local</SectionTitle>
        <p className="mt-0.5 text-sm text-ink/60">
          Estos datos aparecen en la portada, en “Más información” y en el mensaje de WhatsApp.
        </p>
      </div>

      <Card className="space-y-3">
        <h4 className="font-bold">Datos del negocio</h4>
        <Field label="Nombre *" hint="Si lleva “&”, se parte en dos líneas dentro del logo">
          <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Subtítulo" hint="Aparece bajo el logo en mayúsculas">
          <TextInput value={form.tagline} onChange={(e) => set({ tagline: e.target.value })} />
        </Field>
        <Field label="Frase de bienvenida">
          <TextInput value={form.welcome} onChange={(e) => set({ welcome: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Horario" hint="Se muestra en la portada y en Más información">
            <TextInput
              value={form.hours}
              onChange={(e) => set({ hours: e.target.value })}
              placeholder="Viernes a martes · 11:30 am a 5:00 pm · Miércoles y jueves cerrado"
            />
          </Field>
          <Field label="Dirección" hint="Con enlace a Google Maps en Más información">
            <TextInput
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              placeholder="Calle, número, colonia"
            />
          </Field>
        </div>
        <Field label="Facebook" hint="Pega el enlace completo o escribe el usuario/página. Ej. @MiNegocio">
          <TextInput
            value={form.facebook}
            onChange={(e) => set({ facebook: e.target.value })}
            placeholder="https://facebook.com/tu-pagina"
          />
        </Field>
      </Card>

      <Card className="overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setScheduleExpanded((expanded) => !expanded)}
          aria-expanded={scheduleExpanded}
          className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-paper/45"
        >
          <span className="min-w-0">
            <span className="block font-bold">Horarios del negocio</span>
            <span className="mt-0.5 block text-xs text-ink/55">
              {form.scheduleMode === "automatic" ? "Apertura automática por día" : form.open ? "Abierta manualmente" : "Cerrada manualmente"}
            </span>
          </span>
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition-transform",
              scheduleExpanded && "rotate-180",
            )}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        {scheduleExpanded && (
          <div className="space-y-5 border-t border-ink/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Control de disponibilidad</p>
                <p className="text-xs text-ink/55">Define cuándo la página acepta pedidos.</p>
              </div>
              <Segmented
                value={form.scheduleMode}
                onChange={(value) => set({ scheduleMode: value })}
                options={[
                  { value: "automatic", label: "Automático" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>

            {form.scheduleMode === "manual" ? (
              <div className="rounded-2xl border border-ink/10 bg-ink/5 p-3">
                <Toggle
                  checked={form.open}
                  onChange={(next) => set({ open: next })}
                  label={form.open ? "La página está abierta manualmente" : "La página está cerrada manualmente"}
                  description="Esto anula el horario automático cuando se usa el modo manual."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleEntries.map(([day, label]) => {
                  const daySchedule = form.schedule[day] ?? DEFAULT_BUSINESS_SCHEDULE[day];
                  return (
                    <div key={day} className="rounded-2xl border border-ink/10 bg-paper/60 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-ink">{label}</span>
                          <Toggle
                            checked={daySchedule.enabled}
                            onChange={(next) => setDay(day, { enabled: next })}
                            label={daySchedule.enabled ? "Activo" : "Inactivo"}
                          />
                        </div>
                        {daySchedule.enabled && (
                          <Button size="sm" variant="ghost" onClick={() => addRange(day)}>
                            + Rango
                          </Button>
                        )}
                      </div>

                      {daySchedule.enabled ? (
                        <div className="space-y-2">
                          {(daySchedule.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges).map((range, idx) => (
                            <div key={`${day}-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                              <Field label="Apertura" plain>
                                <TextInput
                                  type="time"
                                  value={range.open}
                                  onChange={(e) => setRange(day, idx, { open: e.target.value })}
                                />
                              </Field>
                              <Field label="Cierre" plain>
                                <TextInput
                                  type="time"
                                  value={range.close}
                                  onChange={(e) => setRange(day, idx, { close: e.target.value })}
                                />
                              </Field>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-[42px]"
                                onClick={() => removeRange(day, idx)}
                                disabled={(daySchedule.ranges ?? DEFAULT_BUSINESS_SCHEDULE[day].ranges).length <= 1}
                              >
                                Quitar
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-ink/55">Este día queda cerrado automáticamente.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <h4 className="font-bold">Logo y portada</h4>
        <p className="text-sm text-ink/60">
          El logo transparente de la marca se usa automáticamente en la portada y en la cabecera del menú.
        </p>
        <Field label="Aviso cuando está cerrado" hint="Aparece en la portada mientras el negocio esté cerrado">
          <TextArea
            rows={2}
            value={form.closedNote}
            onChange={(e) => set({ closedNote: e.target.value })}
            placeholder="Volvemos en un ratito…"
          />
        </Field>
        <p className="text-[0.7rem] leading-snug text-ink/50">
          El estado abierto/cerrado se controla con el botón de la parte superior del panel.
        </p>
      </div>

      <Card className="space-y-3">
        <h4 className="font-bold">WhatsApp y envíos</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Número de WhatsApp *" hint="Solo dígitos, con lada internacional. Ej. 525635397099">
            <TextInput
              inputMode="numeric"
              value={form.whatsappNumber}
              onChange={(e) => set({ whatsappNumber: e.target.value })}
            />
          </Field>
          <Field label="Número como se muestra" hint="Ej. 56 3539 7099">
            <TextInput value={form.whatsappDisplay} onChange={(e) => set({ whatsappDisplay: e.target.value })} />
          </Field>
        </div>
        <Field label="Nota de envíos" hint="Texto del pie del menú, antes del número">
          <TextInput value={form.deliveryNote} onChange={(e) => set({ deliveryNote: e.target.value })} />
        </Field>
      </Card>

      <Card className="space-y-4">
        <div>
          <h4 className="font-bold">Formas de pago</h4>
          <p className="text-xs text-ink/55">
            Se muestran en el pie del menú y el cliente elige una al hacer su pedido.
          </p>
        </div>
        {form.payments.map((p) => (
          <div key={p.id} className="rounded-xl bg-paper/50 p-3 ring-1 ring-ink/8">
            <div className="flex items-center gap-3">
              <PaymentIcon id={p.id} className="h-8 w-8" />
              <div className="flex-1">
                <Toggle
                  checked={p.enabled}
                  onChange={(v) => setPayment(p.id, { enabled: v })}
                  label={p.label}
                  description={p.enabled ? "Disponible para los clientes" : "Oculto"}
                />
              </div>
            </div>
            {p.enabled && (
              <div className="mt-3">
                <Field label="Datos para el cliente" hint={PAYMENT_HINTS[p.id]}>
                  <TextArea
                    rows={2}
                    value={p.details}
                    onChange={(e) => setPayment(p.id, { details: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>
        ))}
      </Card>

      <SaveBar dirty={dirty} error={error} onSave={save} />
    </div>
  );
}
