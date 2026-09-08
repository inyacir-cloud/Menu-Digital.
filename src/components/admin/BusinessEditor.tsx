import { useState } from "react";
import type { PaymentId, PaymentMethod, Settings } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { PaymentIcon } from "../PaymentBadges";
import { ImageField } from "./ImageField";
import { Card, Field, SaveBar, SectionTitle, TextArea, TextInput, Toggle } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

const PAYMENT_HINTS: Record<PaymentId, string> = {
  efectivo: "Opcional. Ej. “Procura traer cambio” o “Aceptamos billetes de $500”.",
  transferencia: "Banco, CLABE y nombre del titular. El cliente los verá al elegir este método.",
  mercadopago: "Alias, CVU o link de cobro de Mercado Pago.",
};

export function BusinessEditor({ store, notify }: Props) {
  const [form, setForm] = useState<Settings>(() => JSON.parse(JSON.stringify(store.settings)) as Settings);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(store.settings);

  const set = (patch: Partial<Settings>) => setForm((f) => ({ ...f, ...patch }));
  const setPayment = (id: PaymentId, patch: Partial<PaymentMethod>) =>
    setForm((f) => ({ ...f, payments: f.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));

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

      <div className="space-y-3">
        <h4 className="font-bold">Logo y portada</h4>
        <ImageField
          label="Imagen del logo"
          value={form.logo}
          onChange={(v) => set({ logo: v })}
          maxSize={512}
          hint="Se muestra en la portada y en la cabecera del menú. Si lo quitas, se usa el sombrero por defecto."
        />
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
