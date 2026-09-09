import { useMemo, useState } from "react";
import type { Combo, ComboGroup, ComboSelectionMode, MenuItem } from "../../types";
import type { MenuStore } from "../../hooks/useMenuStore";
import { uid } from "../../utils/id";
import { Button, Card, Field, SectionTitle, Segmented, TextInput, Toggle, inputCls } from "./ui";
import { PlusIcon, TrashIcon } from "../icons";

interface Props { store: MenuStore; notify: (text: string) => void; }
type CatalogItem = MenuItem & { categoryTitle: string };
type CatalogSource = { id: string; title: string; items: CatalogItem[] };

function ComboForm({ initial, catalog, sources, onSave, onCancel }: { initial?: Combo; catalog: CatalogItem[]; sources: CatalogSource[]; onSave: (combo: Omit<Combo, "id">) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [groups, setGroups] = useState<ComboGroup[]>(initial?.groups ?? [{ id: uid("combo-group"), title: "Elige tu producto", required: true, minSelections: 1, maxSelections: 1, options: [], selectionMode: "products" }]);
  const [step, setStep] = useState(1);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("todos");
  const [error, setError] = useState("");
  const categories = useMemo(() => [...new Set(catalog.map((item) => item.categoryTitle))], [catalog]);
  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesCategory = catalogCategory === "todos" || item.categoryTitle === catalogCategory;
      const matchesQuery = !query || `${item.name} ${item.categoryTitle}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [catalog, catalogCategory, catalogQuery]);
  const updateGroup = (id: string, patch: Partial<ComboGroup>) => setGroups((current) => current.map((group) => group.id === id ? { ...group, ...patch } : group));
  const optionsFor = (source: CatalogSource) => source.items.map((item) => ({ id: uid("combo-option"), itemId: item.id, label: item.name, unavailable: item.unavailable }));
  const changeSelectionMode = (group: ComboGroup, selectionMode: ComboSelectionMode) => {
    if (selectionMode === "products") return updateGroup(group.id, { selectionMode, categoryId: undefined, categoryTitle: undefined, options: [] });
    const source = sources.find((candidate) => candidate.id === group.categoryId) ?? sources[0];
    if (!source) return;
    updateGroup(group.id, { selectionMode, categoryId: source.id, categoryTitle: source.title, options: optionsFor(source) });
  };
  const changeCategory = (group: ComboGroup, categoryId: string) => {
    const source = sources.find((candidate) => candidate.id === categoryId);
    if (!source) return;
    updateGroup(group.id, { categoryId: source.id, categoryTitle: source.title, options: optionsFor(source), maxSelections: Math.min(group.maxSelections, source.items.length) || 1, minSelections: Math.min(group.minSelections, source.items.length) });
  };
  const toggleOption = (group: ComboGroup, item: CatalogItem) => {
    if (item.unavailable && !group.options.some((option) => option.itemId === item.id)) return;
    const exists = group.options.some((option) => option.itemId === item.id);
    const options = exists
      ? group.options.filter((option) => option.itemId !== item.id)
      : [...group.options, { id: uid("combo-option"), itemId: item.id, label: item.name, categoryTitle: item.categoryTitle, unavailable: item.unavailable }];
    updateGroup(group.id, { options });
  };
  const save = () => {
    const amount = Number(price.replace(",", "."));
    if (!name.trim() || !Number.isFinite(amount) || amount < 0) return setError("Escribe nombre y precio válido.");
    if (groups.length === 0) return setError("Agrega al menos un grupo de elección.");
    if (groups.some((group) => !group.title.trim() || group.options.length === 0 || group.minSelections < 0 || group.minSelections > group.maxSelections || group.maxSelections > group.options.length || (group.selectionMode === "category" && !group.categoryId))) {
      return setError("Cada grupo necesita nombre, origen, productos y límites válidos.");
    }
    const catalogById = new Map(catalog.map((item) => [item.id, item]));
    const cleanGroups = groups.map((group) => ({
      ...group,
      title: group.title.trim(),
      selectionMode: group.selectionMode ?? "products",
      categoryId: group.selectionMode === "category" ? group.categoryId : undefined,
      categoryTitle: group.selectionMode === "category" ? group.categoryTitle : undefined,
      options: group.options.flatMap((option) => {
        const item = catalogById.get(option.itemId);
        return item ? [{ ...option, label: item.name, categoryTitle: item.categoryTitle, unavailable: item.unavailable }] : [];
      }),
    }));
    if (cleanGroups.some((group) => group.options.length === 0 || group.maxSelections > group.options.length)) return setError("Un producto usado en el combo ya no existe. Revisa sus grupos.");
    onSave({ name: name.trim(), price: amount, description: description.trim() || undefined, enabled, groups: cleanGroups });
  };
  const nextStep = () => {
    if (step === 1) {
      const amount = Number(price.replace(",", "."));
      if (!name.trim() || !Number.isFinite(amount) || amount < 0) return setError("Escribe nombre y precio válido.");
    }
    if (step === 2 && groups.some((group) => !group.title.trim() || group.minSelections < 0 || group.minSelections > group.maxSelections || (group.selectionMode === "category" && !group.categoryId))) {
      return setError("Completa el nombre, origen y cantidades de cada grupo.");
    }
    setError("");
    setStep((current) => Math.min(3, current + 1));
  };
  return <Card className="space-y-4 ring-2 ring-mustard">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-ink/50">Paso {step} de 3</p><h4 className="font-bold">{step === 1 ? "Información del combo" : step === 2 ? "Define los grupos" : "Elige los productos"}</h4></div><span className="text-xs text-ink/50">{step === 1 ? "Datos básicos" : step === 2 ? "Reglas de elección" : "Productos de la promoción"}</span></div>
    {step === 1 && <><div className="grid gap-3 sm:grid-cols-[1fr_8rem]"><Field label="Nombre del combo *"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Combo familiar" /></Field><Field label="Precio *"><TextInput value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" /></Field></div><Field label="Descripción"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Incluye ..." /></Field><Toggle checked={enabled} onChange={setEnabled} label="Mostrar en el menú" description="Los combos apagados quedan guardados, pero no se ofrecen." /></>}
    {step > 1 && groups.map((group) => <div key={group.id} className="space-y-3 rounded-xl bg-paper/60 p-3 ring-1 ring-ink/10">
      <div className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]"><TextInput value={group.title} onChange={(e) => updateGroup(group.id, { title: e.target.value })} placeholder="Nombre del grupo" aria-label="Nombre del grupo" /><TextInput type="number" min={0} value={group.minSelections} onChange={(e) => updateGroup(group.id, { minSelections: Math.max(0, Number(e.target.value) || 0) })} aria-label="Mínimo de elecciones" /><TextInput type="number" min={1} value={group.maxSelections} onChange={(e) => updateGroup(group.id, { maxSelections: Math.max(1, Number(e.target.value) || 1) })} aria-label="Máximo de elecciones" /><Button variant="ghost" onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))} icon={<TrashIcon className="h-4 w-4" />}>Quitar</Button></div>
      {step === 2 && <><Segmented value={group.selectionMode ?? "products"} onChange={(value) => changeSelectionMode(group, value)} options={[{ value: "products", label: "Productos específicos" }, { value: "category", label: "Categoría completa" }]} />{group.selectionMode === "category" && <select className={inputCls} value={group.categoryId ?? ""} onChange={(e) => changeCategory(group, e.target.value)} aria-label="Categoría del grupo"><option value="">Selecciona una categoría</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</select>}</>}
      {step === 3 && <>{group.selectionMode === "category" ? <div className="space-y-2"><p className="text-xs text-ink/55">Marca solo los productos que entran en la promoción. Seleccionados: <strong>{group.options.length}</strong>.</p><div className="grid gap-1 sm:grid-cols-2">{(sources.find((source) => source.id === group.categoryId)?.items ?? []).filter((item) => !catalogQuery.trim() || item.name.toLowerCase().includes(catalogQuery.trim().toLowerCase())).map((item) => { const checked = group.options.some((option) => option.itemId === item.id); return <label key={item.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${item.unavailable ? "bg-ink/5 text-ink/45" : "bg-white/70"}`}><input type="checkbox" checked={checked} disabled={item.unavailable && !checked} onChange={() => toggleOption(group, item)} /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="text-right text-xs text-ink/45">{item.unavailable ? "Agotado" : item.categoryTitle}</span></label>; })}</div></div> : <><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]"><TextInput value={catalogQuery} onChange={(e) => setCatalogQuery(e.target.value)} placeholder="Buscar producto..." aria-label="Buscar producto" /><select className={inputCls} value={catalogCategory} onChange={(e) => setCatalogCategory(e.target.value)} aria-label="Filtrar por categoría"><option value="todos">Todas las categorías</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div className="grid gap-1 sm:grid-cols-2">{filteredCatalog.map((item) => { const checked = group.options.some((option) => option.itemId === item.id); return <label key={item.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${item.unavailable ? "bg-ink/5 text-ink/45" : "bg-white/70"}`}><input type="checkbox" checked={checked} disabled={item.unavailable && !checked} onChange={() => toggleOption(group, item)} /><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="text-right text-xs text-ink/45">{item.unavailable ? "Agotado" : item.categoryTitle}</span></label>; })}</div>{filteredCatalog.length === 0 && <p className="rounded-lg bg-white/60 px-3 py-4 text-center text-xs text-ink/55">No encontramos productos con ese filtro.</p>}</>}</>}
    </div>)}
    {step === 2 && <Button variant="ghost" onClick={() => setGroups((current) => [...current, { id: uid("combo-group"), title: "Elige otro producto", required: true, minSelections: 1, maxSelections: 1, options: [], selectionMode: "products" }])} icon={<PlusIcon className="h-4 w-4" />}>Agregar grupo de elección</Button>}
    {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    <div className="flex flex-wrap justify-between gap-2"><Button variant="ghost" onClick={step === 1 ? onCancel : () => { setError(""); setStep((current) => current - 1); }}>{step === 1 ? "Cancelar" : "Atrás"}</Button>{step < 3 ? <Button onClick={nextStep}>Continuar</Button> : <Button onClick={save}>{initial ? "Guardar combo" : "Crear combo"}</Button>}</div>
  </Card>;
}

export function CombosEditor({ store, notify }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const sources = useMemo<CatalogSource[]>(() => [
    ...store.categories.map((category) => ({ id: category.id, title: category.title, items: category.items.map((item) => ({ ...item, categoryTitle: category.title })) })),
    { id: "seasonal", title: store.seasonal.title || "Temporada", items: store.seasonal.items.map((item) => ({ ...item, categoryTitle: store.seasonal.title || "Temporada" })) },
    { id: "bebidas", title: store.bebidas.title || "Bebidas", items: store.bebidas.items.map((item) => ({ ...item, categoryTitle: store.bebidas.title || "Bebidas" })) },
  ], [store.categories, store.seasonal.items, store.seasonal.title, store.bebidas.items, store.bebidas.title]);
  const catalog = useMemo<CatalogItem[]>(() => {
    const items = sources.flatMap((source) => source.items);
    return [...new Map(items.map((item) => [item.id, item])).values()];
  }, [sources]);
  return <div className="space-y-4"><SectionTitle>Combos</SectionTitle><p className="text-sm text-ink/60">Crea ofertas con precio fijo usando productos existentes o categorías completas. Ejemplo: 2 tacos y 1 bebida.</p><Card><div className="flex items-center justify-between"><h4 className="font-bold">Combos <span className="font-normal text-ink/50">({store.combos.length})</span></h4>{!adding && <Button size="sm" onClick={() => setAdding(true)} icon={<PlusIcon className="h-4 w-4" />}>Agregar combo</Button>}</div></Card>
    {adding && <ComboForm catalog={catalog} sources={sources} onCancel={() => setAdding(false)} onSave={(combo) => { store.addCombo(combo); setAdding(false); notify("Combo creado"); }} />}
    {store.combos.map((combo) => editing === combo.id ? <ComboForm key={combo.id} initial={combo} catalog={catalog} sources={sources} onCancel={() => setEditing(null)} onSave={(next) => { store.updateCombo(combo.id, next); setEditing(null); notify("Combo actualizado"); }} /> : <Card key={combo.id} className="flex items-center gap-3"><div className="min-w-0 flex-1"><h4 className="font-bold">{combo.name}</h4><p className="text-sm text-ink/60">${combo.price} · {combo.groups.length} grupo(s) de elección</p></div><Button size="sm" variant="ghost" onClick={() => setEditing(combo.id)}>Editar</Button><Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`¿Eliminar ${combo.name}?`)) { store.removeCombo(combo.id); notify("Combo eliminado"); } }} icon={<TrashIcon className="h-4 w-4" />}>Eliminar</Button></Card>)}
  </div>;
}
