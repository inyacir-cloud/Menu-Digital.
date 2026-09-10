import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type { CategoryLayout, Extra, MenuCategory, MenuItem, SizeOption } from "../../types";
import type { CategoryInput, ItemInput, MenuStore } from "../../hooks/useMenuStore";
import { resolveImage } from "../../data/menu";
import { formatPrice } from "../../utils/format";
import { cleanExtras, cleanSizes, withQuickCheeseExtra } from "../../utils/menu";
import { cn } from "../../utils/cn";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "../icons";
import { ImageField } from "./ImageField";
import { ExtrasEditor } from "./ExtrasEditor";
import { SizesEditor } from "./SizesEditor";
import {
  Button,
  Card,
  Field,
  IconBtn,
  SectionTitle,
  Segmented,
  Switch,
  TextArea,
  TextInput,
  Thumb,
  Toggle,
} from "./ui";

interface Props {
  store: MenuStore;
  notify: (text: string) => void;
}

const BADGE_SUGGESTIONS = ["Más pedido", "Nuevo", "Recomendado", "Picante"];

export function MenuEditor({ store, notify }: Props) {
  const [expanded, setExpanded] = useState<string | null>(store.categories[0]?.id ?? null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [addingItemFor, setAddingItemFor] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle>Categorías y productos</SectionTitle>
          <p className="mt-0.5 text-sm text-ink/60">
            Agrega, edita, reordena o elimina. Los cambios se ven al instante en el menú.
          </p>
        </div>
        <Button onClick={() => setAddingCategory(true)} icon={<PlusIcon className="h-4 w-4" />}>
          Nueva categoría
        </Button>
      </div>

      {addingCategory && (
        <Card className="ring-2 ring-mustard">
          <h4 className="mb-3 font-bold">Nueva categoría</h4>
          <CategoryForm
            onSave={(values) => {
              const id = store.addCategory(values);
              setAddingCategory(false);
              setExpanded(id);
              setAddingItemFor(id);
              notify("Categoría creada · ahora agrega productos");
            }}
            onCancel={() => setAddingCategory(false)}
          />
        </Card>
      )}

      {store.categories.length === 0 && !addingCategory && (
        <Card className="text-center text-sm text-ink/60">
          No hay categorías. Crea la primera con “Nueva categoría”.
        </Card>
      )}

      <ul className="space-y-3">
        {store.categories.map((cat, index) => {
          const isOpen = expanded === cat.id;
          return (
            <li key={cat.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/8">
              {editingCategory === cat.id ? (
                <div className="p-4">
                  <h4 className="mb-3 font-bold">Editar categoría</h4>
                  <CategoryForm
                    initial={cat}
                    onSave={(values) => {
                      store.updateCategory(cat.id, values);
                      setEditingCategory(null);
                      notify("Categoría actualizada");
                    }}
                    onCancel={() => setEditingCategory(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 sm:gap-3">
                  <Thumb src={resolveImage(cat.image)} size="lg" />
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    aria-expanded={isOpen}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-base font-bold">{cat.title}</p>
                    <p className="truncate text-xs text-ink/55">
                      {cat.items.length} {cat.items.length === 1 ? "producto" : "productos"}
                      {" · "}
                      {cat.layout === "grid" ? "cuadrícula" : "lista"}
                    </p>
                  </button>
                  <div className="flex items-center">
                    <IconBtn label="Subir" disabled={index === 0} onClick={() => store.moveCategory(cat.id, -1)}>
                      <ChevronUpIcon />
                    </IconBtn>
                    <IconBtn
                      label="Bajar"
                      disabled={index === store.categories.length - 1}
                      onClick={() => store.moveCategory(cat.id, 1)}
                    >
                      <ChevronDownIcon />
                    </IconBtn>
                    <IconBtn label="Editar categoría" onClick={() => setEditingCategory(cat.id)}>
                      <PencilIcon />
                    </IconBtn>
                    <IconBtn
                      label="Eliminar categoría"
                      danger
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${cat.title}" y sus ${cat.items.length} productos?`)) {
                          store.removeCategory(cat.id);
                          notify("Categoría eliminada");
                        }
                      }}
                    >
                      <TrashIcon />
                    </IconBtn>
                    <IconBtn label={isOpen ? "Contraer" : "Ver productos"} onClick={() => toggle(cat.id)}>
                      <ChevronDownIcon className={cn("transition-transform", isOpen && "rotate-180")} />
                    </IconBtn>
                  </div>
                </div>
              )}

              {isOpen && (
                <div className="border-t border-ink/8 bg-paper/50 p-3">
                  {cat.items.length === 0 && addingItemFor !== cat.id && (
                    <p className="px-1 pb-2 text-xs text-ink/55">Esta categoría aún no tiene productos.</p>
                  )}

                  <ul className="space-y-1.5">
                    {cat.items.map((item, i) => (
                      <li key={item.id}>
                        {editingItem === item.id ? (
                          <div className="rounded-xl bg-white p-3 ring-2 ring-mustard">
                            <ItemForm
                              initial={item}
                              onSave={(values) => {
                                store.updateItem(cat.id, item.id, values);
                                setEditingItem(null);
                                notify("Producto actualizado");
                              }}
                              onCancel={() => setEditingItem(null)}
                            />
                          </div>
                        ) : (
                          <AdminItemRow
                            item={item}
                            first={i === 0}
                            last={i === cat.items.length - 1}
                            onToggleAvailable={() => {
                              store.updateItem(cat.id, item.id, { unavailable: item.unavailable ? undefined : true });
                              notify(item.unavailable ? `"${item.name}" encendido` : `"${item.name}" apagado`);
                            }}
                            onMove={(dir) => store.moveItem(cat.id, item.id, dir)}
                            onEdit={() => {
                              setEditingItem(item.id);
                              setAddingItemFor(null);
                            }}
                            onRemove={() => {
                              if (window.confirm(`¿Eliminar "${item.name}"?`)) {
                                store.removeItem(cat.id, item.id);
                                notify("Producto eliminado");
                              }
                            }}
                          />
                        )}
                      </li>
                    ))}
                  </ul>

                  {addingItemFor === cat.id ? (
                    <div className="mt-2 rounded-xl bg-white p-3 ring-2 ring-mustard">
                      <h4 className="mb-2 text-sm font-bold">Nuevo producto en {cat.title}</h4>
                      <ItemForm
                        allowAnother
                        onSave={(values, another) => {
                          store.addItem(cat.id, values);
                          notify(`"${values.name}" agregado`);
                          if (!another) setAddingItemFor(null);
                        }}
                        onCancel={() => setAddingItemFor(null)}
                      />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="mt-2 w-full border-dashed"
                      onClick={() => {
                        setAddingItemFor(cat.id);
                        setEditingItem(null);
                      }}
                      icon={<PlusIcon className="h-4 w-4" />}
                    >
                      Agregar producto
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fila de producto en el panel                                        */
/* ------------------------------------------------------------------ */

export interface AdminItemRowProps {
  item: MenuItem;
  first: boolean;
  last: boolean;
  onToggleAvailable: () => void;
  onMove: (dir: -1 | 1) => void;
  onEdit: () => void;
  onRemove: () => void;
}

export function AdminItemRow({
  item,
  first,
  last,
  onToggleAvailable,
  onMove,
  onEdit,
  onRemove,
}: AdminItemRowProps) {
  const ownExtras = item.extras?.length ?? 0;
  const meta = [
    item.description,
    ownExtras > 0 ? `${ownExtras} ${ownExtras === 1 ? "extra propio" : "extras propios"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-2.5 ring-1 ring-ink/6 transition",
        item.unavailable && "bg-white/70 opacity-75",
      )}
    >
      <div className="flex items-center gap-2.5">
        <Switch
          checked={!item.unavailable}
          onChange={onToggleAvailable}
          label={`${item.unavailable ? "Encender" : "Apagar"} ${item.name}`}
        />
        <Thumb src={resolveImage(item.image)} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 break-words text-sm font-bold leading-snug text-ink">{item.name}</p>
            {item.badge && (
              <span className="rounded-full bg-mustard/40 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-ink/80">
                {item.badge}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider",
                item.unavailable ? "bg-red-100 text-red-700" : "bg-wa/15 text-wa-deep",
              )}
            >
              {item.unavailable ? "Apagado" : "Encendido"}
            </span>
          </div>
          {meta && <p className="mt-0.5 break-words text-[0.7rem] leading-snug text-ink/50">{meta}</p>}
        </div>
        <span className="shrink-0 text-sm font-bold tabular-nums">{formatPrice(item.price)}</span>
      </div>

      <div className="mt-2 flex justify-end border-t border-ink/5 pt-1.5">
        <IconBtn label="Subir" disabled={first} onClick={() => onMove(-1)}>
          <ChevronUpIcon />
        </IconBtn>
        <IconBtn label="Bajar" disabled={last} onClick={() => onMove(1)}>
          <ChevronDownIcon />
        </IconBtn>
        <IconBtn label="Editar producto" onClick={onEdit}>
          <PencilIcon />
        </IconBtn>
        <IconBtn label="Eliminar producto" danger onClick={onRemove}>
          <TrashIcon />
        </IconBtn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formularios                                                         */
/* ------------------------------------------------------------------ */

interface CategoryFormProps {
  initial?: MenuCategory;
  onSave: (values: CategoryInput) => void;
  onCancel: () => void;
}

function CategoryForm({ initial, onSave, onCancel }: CategoryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [layout, setLayout] = useState<CategoryLayout>(initial?.layout ?? "list");
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [imageSide, setImageSide] = useState<"left" | "right">(initial?.imageSide ?? "right");
  const [blend, setBlend] = useState(initial?.blend !== false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      setError("Escribe el nombre de la categoría");
      return;
    }
    onSave({
      title: t,
      description: description.trim() || undefined,
      layout,
      image,
      imageAlt: image ? `Foto de ${t}` : undefined,
      imageSide,
      blend,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nombre de la categoría *" error={error}>
        <TextInput
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="Ej. Bebidas"
          autoFocus
          invalid={!!error}
        />
      </Field>

      <Field label="Descripción (opcional)" hint="Se muestra bajo el título de la sección">
        <TextInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej. Acompañados de papas a la francesa"
        />
      </Field>

      <Field label="Diseño de la sección" plain hint="Lista para platillos; cuadrícula compacta para complementos, bebidas o postres">
        <Segmented
          value={layout}
          onChange={setLayout}
          options={[
            { value: "list", label: "Lista" },
            { value: "grid", label: "Cuadrícula" },
          ]}
        />
      </Field>

      <ImageField
        label="Foto de la sección"
        value={image}
        onChange={setImage}
        allowBuiltin
        maxSize={720}
        hint="Ideal: foto con fondo blanco para que se funda con el papel."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Posición de la foto (escritorio)" plain>
          <Segmented
            value={imageSide}
            onChange={setImageSide}
            options={[
              { value: "right", label: "Derecha" },
              { value: "left", label: "Izquierda" },
            ]}
          />
        </Field>
        <div className="flex items-end">
          <Toggle
            checked={blend}
            onChange={setBlend}
            label="Fundir con el papel"
            description="Actívalo si la foto tiene fondo blanco"
          />
        </div>
      </div>

      <FormActions onCancel={onCancel} saveLabel={initial ? "Guardar cambios" : "Crear categoría"} />
    </form>
  );
}

export interface ItemFormProps {
  initial?: MenuItem;
  defaultSizes?: SizeOption[];
  allowAnother?: boolean;
  onSave: (values: ItemInput, another: boolean) => void;
  onCancel: () => void;
}

export function ItemForm({ initial, defaultSizes, allowAnother, onSave, onCancel }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [badge, setBadge] = useState(initial?.badge ?? "");
  const [unavailable, setUnavailable] = useState(initial?.unavailable ?? false);
  const [cartName, setCartName] = useState(initial?.cartName ?? "");
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [extras, setExtras] = useState<Extra[]>(() => withQuickCheeseExtra(initial?.extras));
  const [requiredExtraSelection, setRequiredExtraSelection] = useState(initial?.requiredExtraSelection ?? false);
  const [sizes, setSizes] = useState<SizeOption[]>(initial?.sizes ?? defaultSizes ?? []);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);

  const validate = (): ItemInput | null => {
    const n = name.trim();
    const p = Number(price.replace(",", "."));
    const errs: { name?: string; price?: string } = {};
    if (!n) errs.name = "Escribe el nombre";
    // El precio solo es obligatorio si no hay tamaños con precio
    const cleanedSizes = cleanSizes(sizes);
    if (cleanedSizes.length === 0 && (price.trim() === "" || !Number.isFinite(p) || p < 0)) {
      errs.price = "Precio inválido";
    }
    setErrors(errs);
    if (errs.name || errs.price) return null;
    const cleaned = cleanExtras(extras);
    return {
      name: n,
      price:
        cleanedSizes.length > 0 && price.trim() === ""
          ? 0
          : Math.max(0, Math.round((Number.isFinite(p) ? p : 0) * 100) / 100),
      description: description.trim() || undefined,
      badge: badge.trim() || undefined,
      unavailable: unavailable || undefined,
      image,
      cartName: cartName.trim() || undefined,
      extras: cleaned.length > 0 ? cleaned : undefined,
      requiredExtraSelection: requiredExtraSelection || undefined,
      sizes: cleanedSizes.length > 0 ? cleanedSizes : undefined,
    };
  };

  const reset = () => {
    setName("");
    setPrice("");
    setDescription("");
    setBadge("");
    setUnavailable(false);
    setCartName("");
    setImage(undefined);
    setExtras(withQuickCheeseExtra());
    setRequiredExtraSelection(false);
    setSizes(defaultSizes ?? []);
    setErrors({});
    nameRef.current?.focus();
  };

  const handle = (another: boolean) => {
    const values = validate();
    if (!values) return;
    onSave(values, another);
    if (another) reset();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handle(false);
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <Field label="Nombre *" error={errors.name}>
          <TextInput
            ref={nameRef}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((er) => ({ ...er, name: undefined }));
            }}
            placeholder="Ej. Arrachera"
            autoFocus
            invalid={!!errors.name}
          />
        </Field>
        <Field
          label="Precio"
          error={errors.price}
          hint={sizes.length > 0 ? "No es obligatorio: el costo lo definen los tamaños" : "Obligatorio (si no defines tamaños)"}
        >
          <TextInput
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setErrors((er) => ({ ...er, price: undefined }));
            }}
            inputMode="decimal"
            placeholder={sizes.length > 0 ? "Por tamaño" : "0"}
            invalid={!!errors.price}
          />
        </Field>
      </div>

      <Field label="Descripción (opcional)" hint="Ingredientes o cómo se sirve. Se muestra bajo el nombre.">
        <TextArea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          placeholder="Ej. Bistec con longaniza"
        />
      </Field>

      <div className="rounded-xl bg-paper/60 p-3 ring-1 ring-ink/8">
        <SizesEditor
          label="Tamaños / presentaciones (opcional)"
          value={sizes}
          onChange={setSizes}
          hint="Ej. Medio litro $20 · Litro $35. Si hay tamaños, el cliente elige uno al agregar y se cobra su precio."
        />
      </div>

      <Field label="Etiqueta destacada (opcional)" plain>
        <TextInput
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          maxLength={18}
          placeholder="Ej. Más pedido"
        />
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {BADGE_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setBadge(badge === s ? "" : s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold transition",
                badge === s ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink/70 hover:border-ink/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <ImageField
        label="Foto del producto (opcional)"
        value={image}
        onChange={setImage}
        maxSize={320}
        hint="Se muestra como miniatura junto al nombre."
      />

      <Toggle
        checked={unavailable}
        onChange={setUnavailable}
        label="Apagado / no disponible"
        description="Se muestra como no disponible y el cliente no lo puede pedir"
      />

      <div className="rounded-xl bg-paper/60 p-3 ring-1 ring-ink/8">
        <ExtrasEditor
          label="Extras de este producto"
          value={extras}
          onChange={setExtras}
          hint={
            requiredExtraSelection
              ? "El cliente elegirá exactamente una opción por cada unidad. Puede repetir sabores."
              : "Ej. “Con Queso + $7” o “Doble carne +$25”. El cliente los elige al agregar este producto."
          }
        />
        {extras.length > 0 && (
          <Toggle
            checked={requiredExtraSelection}
            onChange={setRequiredExtraSelection}
            label="Exigir una opción por unidad"
            description="Úsalo para productos como tostadas: una elección obligatoria por cada pieza solicitada."
          />
        )}
      </div>

      <Field
        label="Nombre en el pedido (opcional)"
        hint="Cómo aparecerá en el carrito y en WhatsApp si quieres que sea distinto."
      >
        <TextInput
          value={cartName}
          onChange={(e) => setCartName(e.target.value)}
          placeholder={name ? `Por defecto: ${name}` : "Igual que el nombre"}
        />
      </Field>

      <FormActions
        onCancel={onCancel}
        saveLabel={initial ? "Guardar cambios" : "Agregar"}
        extra={
          allowAnother ? (
            <Button variant="ghost" onClick={() => handle(true)}>
              Guardar y agregar otro
            </Button>
          ) : undefined
        }
      />
    </form>
  );
}

function FormActions({ onCancel, saveLabel, extra }: { onCancel: () => void; saveLabel: string; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      <Button variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      {extra}
      <Button type="submit">{saveLabel}</Button>
    </div>
  );
}
