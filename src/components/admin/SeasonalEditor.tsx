import { useState } from "react";
import type { MenuStore } from "../../hooks/useMenuStore";
import { formatPrice } from "../../utils/format";
import { LeafIcon, PlusIcon } from "../icons";
import { AdminItemRow, ItemForm } from "./MenuEditor";
import { Button, Card, Field, SectionTitle, TextInput, Toggle } from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

/**
 * Apartado propio para productos de temporada: no forma parte de las
 * categorías del menú. Si está apagado o vacío, no se muestra al cliente.
 */
export function SeasonalEditor({ store, notify }: Props) {
  const seasonal = store.seasonal;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-terracotta text-white">
            <LeafIcon className="h-4 w-4" />
          </span>
          Productos de temporada
        </SectionTitle>
        <p className="mt-1 text-sm text-ink/60">
          Sección independiente del menú: aparece destacada <strong>después de las categorías y antes
          de bebidas</strong>, solo cuando la activas y tiene productos. Úsala para birria, chiles en
          nogada, frutas de temporada…
        </p>
      </div>

      <Card className="space-y-3">
        <Toggle
          checked={seasonal.enabled}
          onChange={(v) => {
            store.updateSeasonal({ enabled: v });
            notify(v ? "Sección de temporada visible en el menú" : "Sección de temporada oculta");
          }}
          label="Mostrar en el menú"
          description={
            seasonal.enabled
              ? "Los clientes la ven destacada con el aviso de disponibilidad."
              : "Apagada: no aparece en el menú ni en el carrito."
          }
        />

        {!seasonal.enabled && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            La sección está oculta. Puedes dejar cargados los productos y activarla cuando lleguen.
          </p>
        )}
        {seasonal.enabled && seasonal.items.length === 0 && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
            Está activada pero sin productos: no se mostrará hasta que agregues al menos uno.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título de la sección">
            <TextInput
              value={seasonal.title}
              onChange={(e) => store.updateSeasonal({ title: e.target.value })}
              placeholder="De temporada"
            />
          </Field>
          <Field label="Aviso de disponibilidad" hint="Se muestra como pastilla junto al título">
            <TextInput
              value={seasonal.note}
              onChange={(e) => store.updateSeasonal({ note: e.target.value })}
              placeholder="Pregunta si hay"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold">
            Productos{" "}
            <span className="text-sm font-normal text-ink/50">({seasonal.items.length})</span>
          </h4>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)} icon={<PlusIcon className="h-3.5 w-3.5" />}>
              Agregar producto
            </Button>
          )}
        </div>

        {seasonal.items.length === 0 && !adding && (
          <p className="mt-2 text-sm text-ink/55">
            Aún no hay productos de temporada. Agrega el primero para preparar la sección.
          </p>
        )}

        <ul className="mt-3 space-y-1.5">
          {seasonal.items.map((item, i) => (
            <li key={item.id}>
              {editing === item.id ? (
                <div className="rounded-xl bg-paper/60 p-3 ring-2 ring-mustard">
                  <ItemForm
                    initial={item}
                    onSave={(values) => {
                      store.updateSeasonalItem(item.id, values);
                      setEditing(null);
                      notify("Producto de temporada actualizado");
                    }}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <AdminItemRow
                  item={item}
                  first={i === 0}
                  last={i === seasonal.items.length - 1}
                  onToggleAvailable={() => {
                    store.updateSeasonalItem(item.id, { unavailable: item.unavailable ? undefined : true });
                    notify(item.unavailable ? `"${item.name}" encendido` : `"${item.name}" apagado`);
                  }}
                  onMove={(dir) => store.moveSeasonalItem(item.id, dir)}
                  onEdit={() => {
                    setEditing(item.id);
                    setAdding(false);
                  }}
                  onRemove={() => {
                    if (window.confirm(`¿Eliminar "${item.name}" de temporada?`)) {
                      store.removeSeasonalItem(item.id);
                      notify("Producto de temporada eliminado");
                    }
                  }}
                />
              )}
            </li>
          ))}
        </ul>

        {adding && (
          <div className="mt-3 rounded-xl bg-paper/60 p-3 ring-2 ring-mustard">
            <h4 className="mb-2 text-sm font-bold">Nuevo producto de temporada</h4>
            <ItemForm
              allowAnother
              onSave={(values, another) => {
                store.addSeasonalItem(values);
                notify(`"${values.name}" agregado a temporada`);
                if (!another) setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </div>
        )}

        {seasonal.items.length > 0 && (
          <p className="mt-3 text-[0.7rem] text-ink/50">
            Cada producto puede llevar sus propios extras, foto, etiqueta y estado (agotado), igual que
            en las categorías. Precio de referencia:{" "}
            <span className="font-semibold">
              {formatPrice(Math.min(...seasonal.items.map((i) => i.price)))} –{" "}
              {formatPrice(Math.max(...seasonal.items.map((i) => i.price)))}
            </span>
            .
          </p>
        )}
      </Card>

      {/* Referencia visual rápida */}
      <Card className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mustard/20 ring-1 ring-ink/10">
          <LeafIcon className="h-6 w-6 text-terracotta" />
        </span>
        <p className="text-sm text-ink/65">
          En el menú, la sección se muestra al final de las categorías con borde punteado terracota y el
          aviso <span className="font-semibold text-ink">“{seasonal.note || "Pregunta si hay"}”</span>.
        </p>
      </Card>
    </div>
  );
}
