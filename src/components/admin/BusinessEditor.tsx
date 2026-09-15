import { useMemo, useState } from "react";
import type { BusinessDaySchedule, BusinessSchedule, PaymentId, PaymentMethod, Settings } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { DEFAULT_SETTINGS } from "../../data/menu";
import { PaymentIcon } from "../PaymentBadges";
import { Button, Card, Field, SaveBar, SectionTitle, TextArea, TextInput, Toggle } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

const PAYMENT_HINTS: Record<PaymentId, string> = {
  efectivo: "Opcional. Ej. “Procura traer cambio” o “Aceptamos billetes de $500”.",
  transferencia: "Banco, CLABE y nombre del titular. El cliente los verá al elegir este método.",
  mercadopago: "Pega únicamente el link de cobro de Mercado Pago; el cliente lo abrirá para pagar el total.",
};

const dayLabel: Record<keyof BusinessSchedule, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

export function BusinessEditor({ store, notify }: Props) {
  const [form, setForm] = useState<Settings>(() => {
    const base = store.settings ?? DEFAULT_SETTINGS;
    return {
      ...DEFAULT_SETTINGS,
      ...base,
      schedule: {
        ...DEFAULT_SETTINGS.schedule,
        ...(base.schedule ?? {}),
      },
    } as Settings;
  });
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(store.settings);

  const scheduleEntries = useMemo(() => Object.entries(dayLabel) as Array<[keyof BusinessSchedule, string]>, []);

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));
  const setPayment = (id: PaymentId, patch: Partial<PaymentMethod>) =>
    setForm((f) => ({ ...f, payments: f.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const updateDay = (day: keyof BusinessSchedule, patch: Partial<BusinessDaySchedule>) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ...patch,
        },
      },
    }));
  };
  const updateRange = (day: keyof BusinessSchedule, index: number, patch: { open?: string; close?: string }) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ranges: f.schedule[day].ranges.map((range, i) => (i === index ? { ...range, ...patch } : range)),
        },
      },
    }));
  };
  const addRange = (day: keyof BusinessSchedule) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          enabled: true,
          ranges: [...f.schedule[day].ranges, { open: "11:30", close: "17:00" }],
        },
      },
    }));
  };
  const removeRange = (day: keyof BusinessSchedule, index: number) => {
    setForm((f) => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          ranges: f.schedule[day].ranges.filter((_, i) => i !== index),
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

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold">Horario y disponibilidad</h4>
            <p className="text-sm text-ink/60">Automatiza la apertura según los días y horas del negocio, o úsalo manualmente cuando quieras cerrar el menú sin tocar el calendario.</p>
          </div>
          <div className="rounded-full border border-ink/10 bg-paper px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink/60">
            {form.scheduleMode === "automatic" ? "Automático" : "Manual"}
          </div>
        </div>

        <div className="rounded-2xl bg-paper/60 p-3 ring-1 ring-ink/8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold text-ink">Modo de apertura</span>
            <div className="inline-flex rounded-full bg-ink/5 p-1">
              <button
                type="button"
                onClick={() => set({ scheduleMode: "automatic" })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  form.scheduleMode === "automatic" ? "bg-ink text-paper shadow-sm" : "text-ink/60"
                }`}
              >
                Automático
              </button>
              <button
                type="button"
                onClick={() => set({ scheduleMode: "manual" })}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  form.scheduleMode === "manual" ? "bg-ink text-paper shadow-sm" : "text-ink/60"
                }`}
              >
                Manual
              </button>
            </div>
          </div>

          {form.scheduleMode === "manual" ? (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-ink">Abrir o cerrar el menú manualmente</p>
                <p className="text-xs text-ink/55">Se usa cuando no quieres depender del calendario.</p>
              </div>
              <Toggle
                checked={form.open}
                onChange={(next) => set({ open: next })}
                label={form.open ? "Menú abierto" : "Menú cerrado"}
              />
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
              El menú se abrirá o cerrará automáticamente según el horario configurado de cada día.
            </div>
          )}
        </div>

        <div className="space-y-3">
          {scheduleEntries.map(([day, label]) => {
            const dayConfig = form.schedule?.[day] ?? DEFAULT_SETTINGS.schedule[day];
            return (
              <div key={day} className="rounded-2xl border border-ink/10 bg-paper/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink">{label}</span>
                  <Toggle
                    checked={dayConfig.enabled}
                    onChange={(next) => updateDay(day, { enabled: next })}
                    label={`${label} ${next ? "habilitado" : "deshabilitado"}`}
                  />
                </div>

                {dayConfig.enabled && (
                  <div className="mt-3 space-y-3">
                    {dayConfig.ranges.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-ink/15 bg-white/70 p-3 text-xs text-ink/55">
                        Sin horarios. Agrega un rango para habilitar este día.
                      </div>
                    ) : null}

                    {dayConfig.ranges.map((range, index) => (
                      <div key={`${day}-${index}`} className="flex flex-col gap-2 rounded-xl bg-white p-2.5 ring-1 ring-ink/8 sm:flex-row sm:items-center">
                        <div className="grid grid-cols-2 gap-2 sm:flex-1">
                          <TextInput
                            type="time"
                            value={range.open}
                            onChange={(e) => updateRange(day, index, { open: e.target.value })}
                          />
                          <TextInput
                            type="time"
                            value={range.close}
                            onChange={(e) => updateRange(day, index, { close: e.target.value })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRange(day, index)}
                          className="w-full sm:w-auto"
                        >
                          Quitar
                        </Button>
                      </div>
                    ))}

                    <Button variant="ghost" size="sm" onClick={() => addRange(day)} className="w-full sm:w-auto">
                      + Agregar rango
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
