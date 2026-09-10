import { useState } from "react";
import type { MenuItem, SizeOption } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { formatPrice } from "../../utils/format";
import { isAvailable, shortSizeName } from "../../utils/menu";
import { cn } from "../../utils/cn";
import { GlassIceIcon, PencilIcon, PlusIcon, TrashIcon } from "../icons";
import { ItemForm } from "./MenuEditor";
import { Button, Card, Field, IconBtn, SectionTitle, Switch, TextInput, Toggle } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

/**
 * Bebidas del día: cada bebida tiene su interruptor y, si tiene tamaños,
 * un interruptor por tamaño (medio litro / litro) totalmente independiente.
 */
export function BebidasEditor({ store, notify }: Props) {
  const bebidas = store.bebidas;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [group, setGroup] = useState<"aguas" | "refrescos">("aguas");

  const enabledCount = bebidas.items.filter(isAvailable).length;
  const isAgua = (item: MenuItem) =>
    /\b(agua|aguas|horchata|jamaica|tamarindo|limonada)\b/i.test(item.name);
  const groupItems = bebidas.items.filter((item) => (group === "aguas" ? isAgua(item) : !isAgua(item)));

  const toggleSize = (item: MenuItem, size: SizeOption) => {
    const off = new Set(item.unavailableSizes ?? []);
    if (off.has(size.id)) {
      off.delete(size.id);
      store.updateBebida(item.id, {
        unavailableSizes: off.size > 0 ? Array.from(off) : undefined,
      });
      notify(`"${item.name} ${shortSizeName(size.name)}" disponible hoy`);
    } else {
      off.add(size.id);
      store.updateBebida(item.id, { unavailableSizes: Array.from(off) });
      notify(`"${item.name} ${shortSizeName(size.name)}" apagada por hoy`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-wa text-white">
            <GlassIceIcon className="h-4 w-4" />
          </span>
          Bebidas del día
        </SectionTitle>
        <p className="mt-1 text-sm text-ink/60">
          Prende o apaga las bebidas que tengas disponibles. Las aguas de sabor muestran{" "}
          <strong>dos tamaños (medio litro / litro) con su precio</strong>, cada uno se prende y apaga
          por separado — por ejemplo, hoy solo medio litro.
        </p>
      </div>

      <Card className="space-y-3">
        <Toggle
          checked={bebidas.enabled}
          onChange={(v) => {
            store.updateBebidas({ enabled: v });
            notify(v ? "Sección de bebidas visible" : "Sección de bebidas oculta");
          }}
          label="Mostrar en el menú"
          description={
            bebidas.enabled
              ? `${enabledCount} ${enabledCount === 1 ? "bebida disponible" : "bebidas disponibles"} hoy`
              : "Apagada: no aparece en el menú."
          }
        />

        {!bebidas.enabled && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            La sección está oculta. Actívala y enciende las bebidas disponibles del día.
          </p>
        )}
        {bebidas.enabled && enabledCount === 0 && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Está activada pero no hay ninguna bebida encendida: no se mostrará nada en el menú.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título de la sección">
            <TextInput
              value={bebidas.title}
              onChange={(e) => store.updateBebidas({ title: e.target.value })}
              placeholder="Bebidas del día"
            />
          </Field>
          <Field label="Aviso" hint="Pastilla junto al título">
            <TextInput
              value={bebidas.note}
              onChange={(e) => store.updateBebidas({ note: e.target.value })}
              placeholder="Disponibilidad del día · pregunta si hay del sabor que quieres"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-paper p-1" role="tablist" aria-label="Tipo de bebida">
          {([
            ["aguas", "Aguas", bebidas.items.filter(isAgua).length],
            ["refrescos", "Refrescos", bebidas.items.filter((item) => !isAgua(item)).length],
          ] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={group === value}
              onClick={() => setGroup(value)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-bold transition",
                group === value ? "bg-ink text-paper shadow-sm" : "text-ink/60 hover:bg-white hover:text-ink",
              )}
            >
              {label} <span className="font-normal opacity-70">({count})</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold">
            {group === "aguas" ? "Aguas" : "Refrescos"}{" "}
            <span className="text-sm font-normal text-ink/50">
              ({groupItems.filter(isAvailable).length} de {groupItems.length} disponibles hoy)
            </span>
          </h4>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)} icon={<PlusIcon className="h-3.5 w-3.5" />}>
              Agregar bebida
            </Button>
          )}
        </div>

        {bebidas.items.length === 0 && !adding && (
          <p className="mt-2 text-sm text-ink/55">
            No hay bebidas cargadas. Agrega la primera para tener la lista lista.
          </p>
        )}

        <ul className="mt-3 space-y-1.5">
          {groupItems.map((item) => {
            const active = isAvailable(item);
            const sizes = item.sizes ?? [];
            const priceLabel =
              sizes.length > 0
                ? `Desde ${formatPrice(Math.min(...sizes.map((s) => s.price)))}`
                : formatPrice(item.price);
            return (
              <li key={item.id}>
                {editing === item.id ? (
                  <div className="rounded-xl bg-paper/60 p-3 ring-2 ring-mustard">
                    <ItemForm
                      initial={item}
                      onSave={(values) => {
                        store.updateBebida(item.id, values);
                        setEditing(null);
                        notify(`"${values.name}" actualizado`);
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-xl bg-paper/60 p-2.5 ring-1 ring-ink/6",
                      !active && "opacity-70",
                    )}
                  >
                    {/* Fila principal: interruptor + nombre + precio + acciones */}
                    <div className="flex items-center gap-2.5">
                      <Switch
                        checked={active}
                        onChange={(v) => {
                          store.updateBebida(item.id, { unavailable: !v || undefined });
                          notify(
                            v
                              ? `"${item.name}" disponible hoy · ya se ofrece en el carrito`
                              : `"${item.name}" apagada por hoy`,
                          );
                        }}
                        label={`${active ? "Apagar" : "Encender"} ${item.name}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <p className="min-w-0 break-words text-sm font-bold leading-snug text-ink">
                            {item.name}
                          </p>
                          {item.badge && (
                            <span className="rounded-full bg-mustard/40 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink/80">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-0.5 break-words text-[0.72rem] leading-snug text-ink/55">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums">{priceLabel}</span>
                      <div className="flex shrink-0 items-center">
                        <IconBtn
                          label="Editar"
                          onClick={() => {
                            setEditing(item.id);
                            setAdding(false);
                          }}
                        >
                          <PencilIcon />
                        </IconBtn>
                        <IconBtn
                          label="Eliminar"
                          danger
                          onClick={() => {
                            if (window.confirm(`¿Eliminar "${item.name}"?`)) {
                              store.removeBebida(item.id);
                              notify(`"${item.name}" eliminado`);
                            }
                          }}
                        >
                          <TrashIcon />
                        </IconBtn>
                      </div>
                    </div>

                    {/* Un interruptor por tamaño: independiente del de la bebida */}
                    {sizes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 md:ml-[3.4rem]">
                        {sizes.map((s) => {
                          const on = !(item.unavailableSizes ?? []).includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleSize(item, s)}
                              aria-pressed={on}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition",
                                on
                                  ? "border-wa bg-wa/15 text-wa-deep"
                                  : "border-ink/20 bg-white text-ink/60 line-through decoration-ink/40",
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  on ? "bg-wa" : "bg-ink/30",
                                )}
                                aria-hidden="true"
                              />
                              {shortSizeName(s.name)} · {formatPrice(s.price)}
                              <span className={cn("font-bold", on ? "text-wa-deep" : "text-ink/50")}>
                                {on ? "Sí" : "No"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {adding && (
          <div className="mt-3 rounded-xl bg-paper/60 p-3 ring-2 ring-mustard">
            <h4 className="mb-2 text-sm font-bold">Nueva bebida</h4>
            <ItemForm
              allowAnother
              defaultSizes={
                group === "aguas"
                  ? [
                      { id: "litro", name: "Litro", price: 35 },
                      { id: "medio-litro", name: "Medio litro", price: 25 },
                    ]
                  : undefined
              }
              onSave={(values, another) => {
                store.addBebida(values);
                notify(`"${values.name}" agregado`);
                if (!another) setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        <p className="mt-3 text-[0.7rem] leading-relaxed text-ink/50">
          El precio general no es obligatorio: lo que define el costo son los{" "}
          <span className="font-semibold text-ink/70">tamaños con su precio</span> (ej. 1/2 L $20 · 1 L
          $35). El cliente elige el tamaño al agregarla y se cobra ese precio.
        </p>
      </Card>
    </div>
  );
}
