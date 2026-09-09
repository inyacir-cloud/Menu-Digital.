import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BebidasSection,
  Combo,
  ComboGroup,
  ComboOption,
  Coupon,
  Extra,
  MenuCategory,
  MenuData,
  MenuItem,
  PaymentMethod,
  SeasonalSection,
  Settings,
  SizeOption,
  Theme,
} from "../types";
import {
  DEFAULT_BEBIDAS,
  DEFAULT_CATEGORIES,
  DEFAULT_COMBOS,
  DEFAULT_MENU,
  DEFAULT_SEASONAL,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
} from "../data/menu";
import { normalizeHex } from "../utils/color";
import { uid } from "../utils/id";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { serializeMenuForSupabase } from "../utils/supabaseMenu";

const STORAGE_KEY = "egf-menu-data-v3";
/** Versiones anteriores: se migran automáticamente al cargar */
const LEGACY_KEYS = ["egf-menu-data-v2", "egf-menu-data-v1"];

/**
 * Productos que dejaron de existir como línea del menú (el "Con Queso +" y
 * duplicados). Al migrar datos guardados se retiran de la lista.
 */
const RETIRED_ITEM_IDS = new Set([
  "taco-queso-extra",
  "goda-queso-extra",
  "ques-queso-extra",
  "goda-chorizo",
  "ques-came-rancho",
  "sope-con-queso-orega",
  "sope-quesadilla",
  "sope-bistec-queso",
  "sope-campechana-queso",
]);

type Raw = Record<string, unknown>;

const asObj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const money = (v: unknown): number => Math.max(0, Math.round(num(v) * 100) / 100);

/* ---------- Validación / normalización de datos (localStorage e importación) ---------- */

function normalizeExtras(raw: unknown): Extra[] {
  if (!Array.isArray(raw)) return [];
  const out: Extra[] = [];
  const seen = new Set<string>();
  for (const e of raw) {
    const r = asObj(e);
    const name = str(r.name).trim();
    if (!name) continue;
    const price = money(r.price);
    const key = `${name.toLocaleLowerCase()}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: str(r.id) || uid("extra"), name, price });
  }
  return out;
}

function normalizeSizes(raw: unknown): SizeOption[] {
  if (!Array.isArray(raw)) return [];
  const out: SizeOption[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    const r = asObj(s);
    const name = str(r.name).trim();
    if (!name) continue;
    const price = money(r.price);
    const key = `${name.toLocaleLowerCase()}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: str(r.id) || uid("size"), name, price });
  }
  return out;
}

function normalizeItem(raw: unknown): MenuItem | null {
  const r = asObj(raw);
  const name = str(r.name).trim();
  if (!name) return null;
  const item: MenuItem = { id: str(r.id) || uid("item"), name, price: money(r.price) };
  if (str(r.description).trim()) item.description = str(r.description).trim();
  if (str(r.badge).trim()) item.badge = str(r.badge).trim();
  if (r.unavailable === true) item.unavailable = true;
  if (str(r.cartName).trim()) item.cartName = str(r.cartName).trim();
  if (str(r.image)) item.image = str(r.image);
  if (Array.isArray(r.extras)) item.extras = normalizeExtras(r.extras);
  if (r.requiredExtraSelection === true) item.requiredExtraSelection = true;
  const sizes = Array.isArray(r.sizes) ? normalizeSizes(r.sizes) : [];
  if (Array.isArray(r.sizes)) item.sizes = sizes;
  const unavailableSizes = (Array.isArray(r.unavailableSizes) ? r.unavailableSizes : [])
    .filter((id): id is string => typeof id === "string" && sizes.some((s) => s.id === id));
  if (unavailableSizes.length > 0) item.unavailableSizes = unavailableSizes;
  return item;
}

/** Añade extras heredados (de categoría o versiones antiguas) como propios de cada producto */
function foldInherited(items: MenuItem[], inherited: Extra[]): MenuItem[] {
  if (inherited.length === 0) return items;
  return items.map((it) => {
    const own = it.extras ?? [];
    const ids = new Set(own.map((e) => e.id));
    const added = inherited.filter((e) => !ids.has(e.id));
    return added.length > 0 ? { ...it, extras: [...own, ...added] } : it;
  });
}

function normalizeCategory(raw: unknown): MenuCategory | null {
  const r = asObj(raw);
  const title = str(r.title).trim();
  if (!title) return null;

  const items: MenuItem[] = [];
  const inherited: Extra[] = [];
  for (const rawItem of Array.isArray(r.items) ? r.items : []) {
    const ri = asObj(rawItem);
    // Versiones anteriores: complementos marcados como "extra" → ahora extras propios
    if (ri.extra === true) {
      const name = str(ri.name).trim();
      if (name) inherited.push({ id: str(ri.id) || uid("extra"), name, price: money(ri.price) });
      continue;
    }
    const item = normalizeItem(rawItem);
    if (item) items.push(item);
  }
  // Extras que en versiones anteriores eran de toda la categoría → pasan a cada producto
  inherited.push(...normalizeExtras(r.extras));

  const category: MenuCategory = {
    id: str(r.id) || uid("cat"),
    title,
    items: foldInherited(items, inherited),
    imageSide: r.imageSide === "left" ? "left" : "right",
  };
  if (str(r.description).trim()) category.description = str(r.description).trim();
  if (str(r.image)) category.image = str(r.image);
  if (str(r.imageAlt)) category.imageAlt = str(r.imageAlt);
  if (r.blend === false) category.blend = false;
  if (r.layout === "grid") category.layout = "grid";
  return category;
}

function normalizeTheme(raw: unknown): Theme {
  const r = asObj(raw);
  const d = DEFAULT_THEME;
  return {
    background: normalizeHex(str(r.background)) ?? d.background,
    text: normalizeHex(str(r.text)) ?? d.text,
    primary: normalizeHex(str(r.primary)) ?? d.primary,
    secondary: normalizeHex(str(r.secondary)) ?? d.secondary,
  };
}

function normalizeSettings(raw: unknown): Settings {
  const r = asObj(raw);
  const rawPayments = (Array.isArray(r.payments) ? r.payments : []).map(asObj);
  const payments: PaymentMethod[] = DEFAULT_SETTINGS.payments.map((def) => {
    const found = rawPayments.find((p) => p.id === def.id);
    if (!found) return { ...def };
    return {
      ...def,
      label: str(found.label).trim() || def.label,
      enabled: found.enabled !== false,
      details: str(found.details),
    };
  });
  const d = DEFAULT_SETTINGS;
  return {
    name: str(r.name).trim() || d.name,
    tagline: str(r.tagline, d.tagline),
    welcome: str(r.welcome, d.welcome),
    whatsappNumber: str(r.whatsappNumber).replace(/\D/g, "") || d.whatsappNumber,
    whatsappDisplay: str(r.whatsappDisplay, d.whatsappDisplay),
    deliveryNote: str(r.deliveryNote, d.deliveryNote),
    hours: str(r.hours).trim() || d.hours,
    address: str(r.address).trim(),
    facebook: str(r.facebook).trim(),
    payments,
    messageTemplate: migrateTemplate(
      str(r.messageTemplate).trim() ? str(r.messageTemplate) : d.messageTemplate,
      r.templateV2 === true,
    ),
    templateV2: true,
    contactMessage: str(r.contactMessage).trim() || d.contactMessage,
    theme: normalizeTheme(r.theme),
    open: r.open !== false,
    closedNote: str(r.closedNote).trim() || d.closedNote,
    logo: str(r.logo) || undefined,
  };
}

/** Añade los marcadores nuevos a plantillas guardadas antes de esta versión */
function migrateTemplate(template: string, alreadyV2: boolean): string {
  if (alreadyV2) return template;
  let out = template;
  if (!out.includes("{propina}")) out += "\n\n{propina}";
  if (!out.includes("{confirmacion}")) out += "\n{confirmacion}";
  return out;
}

function normalizeSeasonal(raw: unknown): SeasonalSection {
  const r = asObj(raw);
  const d = DEFAULT_SEASONAL;
  // El aviso antiguo incluía "tiempo limitado": se sustituye por el actual
  const legacyNote = typeof r.note === "string" && /tiempo limitado/i.test(r.note);
  return {
    enabled: r.enabled === true,
    title: str(r.title).trim() || d.title,
    note: legacyNote ? d.note : typeof r.note === "string" ? r.note : d.note,
    items: (Array.isArray(r.items) ? r.items : [])
      .map(normalizeItem)
      .filter((i): i is MenuItem => i !== null),
  };
}

function normalizeCoupons(raw: unknown): Coupon[] {
  if (!Array.isArray(raw)) return [];
  const out: Coupon[] = [];
  for (const c of raw) {
    const r = asObj(c);
    const code = str(r.code).trim().toUpperCase();
    if (!code) continue;
    const coupon: Coupon = {
      id: str(r.id) || uid("cupon"),
      code,
      type: r.type === "monto" ? "monto" : "percent",
      value: Math.max(0, num(r.value)),
      enabled: r.enabled !== false,
      maxUses: Math.max(0, Math.round(num(r.maxUses, 0))),
      used: Math.max(0, Math.round(num(r.used, 0))),
    };
    if (/^\d{4}-\d{2}-\d{2}$/.test(str(r.expiresAt))) coupon.expiresAt = str(r.expiresAt);
    const minOrder = num(r.minOrder, 0);
    if (minOrder > 0) coupon.minOrder = minOrder;
    out.push(coupon);
  }
  return out;
}

function normalizeBebidas(raw: unknown): BebidasSection {
  const r = asObj(raw);
  const d = DEFAULT_BEBIDAS;
  const defaultsById = new Map(d.items.map((i) => [i.id, i] as const));
  return {
    enabled: r.enabled === true,
    title: str(r.title).trim() || d.title,
    note: typeof r.note === "string" ? r.note : d.note,
    items: (Array.isArray(r.items) ? r.items : [])
      .map((rawItem) => {
        const item = normalizeItem(rawItem);
        if (!item) return null;
        // Si el sabor guardado es de los oficiales y no tiene tamaños, se agregan
        const def = defaultsById.get(item.id);
        if (def?.sizes && (!item.sizes || item.sizes.length === 0)) item.sizes = def.sizes;
        return item;
      })
      .filter((i): i is MenuItem => i !== null),
  };
}

function normalizeCombos(raw: unknown): Combo[] {
  if (!Array.isArray(raw)) return [...DEFAULT_COMBOS];
  return raw.flatMap((rawCombo) => {
    const r = asObj(rawCombo);
    const name = str(r.name).trim();
    if (!name) return [];
    const groups: ComboGroup[] = (Array.isArray(r.groups) ? r.groups : []).flatMap((rawGroup) => {
      const g = asObj(rawGroup);
      const title = str(g.title).trim();
      if (!title) return [];
      const options: ComboOption[] = (Array.isArray(g.options) ? g.options : []).flatMap((rawOption) => {
        const o = asObj(rawOption);
        const itemId = str(o.itemId);
        const label = str(o.label).trim();
        if (!itemId || !label) return [];
        return [{ id: str(o.id) || uid("combo-opt"), itemId, label, categoryTitle: str(o.categoryTitle ?? o.category_title).trim() || undefined, unavailable: o.unavailable === true }];
      });
      if (options.length === 0) return [];
      const maxSelections = Math.max(1, Math.round(num(g.maxSelections, 1)));
      const minSelections = Math.max(0, Math.min(maxSelections, Math.round(num(g.minSelections, g.required === false ? 0 : 1))));
      return [{
        id: str(g.id) || uid("combo-group"),
        title,
        required: g.required !== false,
        minSelections,
        maxSelections,
        options,
        selectionMode: (g.selectionMode ?? g.selection_mode) === "category" ? "category" : "products",
        categoryId: str(g.categoryId ?? g.category_id) || undefined,
        categoryTitle: str(g.categoryTitle ?? g.category_title).trim() || undefined,
      }];
    });
    if (groups.length === 0) return [];
    return [{
      id: str(r.id) || uid("combo"),
      name,
      price: money(r.price),
      description: str(r.description).trim() || undefined,
      badge: str(r.badge).trim() || undefined,
      image: str(r.image) || undefined,
      enabled: r.enabled !== false,
      groups,
    }];
  });
}

export function normalizeMenuData(raw: unknown): MenuData {
  if (!raw || typeof raw !== "object") throw new Error("El archivo no tiene un formato válido");
  const r = raw as Raw;
  if (!Array.isArray(r.categories)) throw new Error("El archivo no contiene categorías del menú");
  const categories = r.categories
    .map(normalizeCategory)
    .filter((c): c is MenuCategory => c !== null);
  return {
    categories,
    seasonal: normalizeSeasonal(r.seasonal),
    bebidas: normalizeBebidas(r.bebidas),
    combos: normalizeCombos(r.combos),
    coupons: normalizeCoupons(r.coupons),
    settings: normalizeSettings(r.settings),
  };
}

/**
 * Migración desde versiones guardadas: retira productos obsoletos, alinea los
 * productos oficiales (precios, nombres y extras propios) con el menú actual y
 * conserva los productos y categorías creados por el administrador.
 */
function reconcileWithDefaults(data: MenuData): MenuData {
  const defaultsById = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c] as const));
  const defaultsByTitle = new Map(DEFAULT_CATEGORIES.map((c) => [c.title.trim().toLowerCase(), c] as const));

  const categories = data.categories.map((c) => {
    const d = defaultsById.get(c.id) ?? defaultsByTitle.get(c.title.trim().toLowerCase());
    if (!d) return c;

    const surviving = c.items.filter((i) => !RETIRED_ITEM_IDS.has(i.id));
    const survivingById = new Map(surviving.map((i) => [i.id, i] as const));
    const survivingByName = new Map(surviving.map((i) => [i.name.trim().toLowerCase(), i] as const));

    const merged: MenuItem[] = d.items.map((di) => {
      const prev = survivingById.get(di.id) ?? survivingByName.get(di.name.trim().toLowerCase());
      if (!prev) return di;
      survivingById.delete(di.id);
      survivingById.delete(prev.id);
      survivingByName.delete(prev.name.trim().toLowerCase());
      // Se conservan los ajustes locales (agotado, foto, etiqueta); el resto se alinea
      return {
        ...di,
        unavailable: prev.unavailable,
        image: prev.image ?? di.image,
        badge: prev.badge ?? di.badge,
        description: prev.description ?? di.description,
        cartName: prev.cartName ?? di.cartName,
        extras: prev.extras ?? di.extras,
        requiredExtraSelection: prev.requiredExtraSelection ?? di.requiredExtraSelection,
        sizes: prev.sizes ?? di.sizes,
        unavailableSizes: prev.unavailableSizes ?? di.unavailableSizes,
      };
    });
    const mergedNames = new Set(merged.map((item) => item.name.trim().toLowerCase()));
    for (const custom of survivingById.values()) {
      const name = custom.name.trim().toLowerCase();
      if (!mergedNames.has(name)) {
        merged.push(custom);
        mergedNames.add(name);
      }
    }

    return { ...c, items: merged };
  });

  const present = new Set(categories.map((c) => c.title.trim().toLowerCase()));
  for (const d of DEFAULT_CATEGORIES) if (!present.has(d.title.trim().toLowerCase())) categories.push(d);

  return { ...data, categories };
}

function loadInitial(): MenuData {
  if (isSupabaseConfigured) return DEFAULT_MENU;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeMenuData(JSON.parse(raw));
    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return reconcileWithDefaults(normalizeMenuData(JSON.parse(legacy)));
    }
  } catch {
    /* datos corruptos: usar el menú por defecto */
  }
  return DEFAULT_MENU;
}

function swap<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (index < 0 || target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type CategoryInput = Omit<MenuCategory, "id" | "items">;
export type ItemInput = Omit<MenuItem, "id">;

/* ---------- Hook ---------- */

export function useMenuStore() {
  const [data, setData] = useState<MenuData>(loadInitial);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(!isSupabaseConfigured);
  const [authVersion, setAuthVersion] = useState(0);
  const syncVersion = useRef(0);
  const syncQueue = useRef(Promise.resolve());

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session) {
        setAuthVersion((version) => version + 1);
        setStorageError(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void supabase.rpc("get_menu").then(({ data: remote, error }) => {
      if (!active) return;
      if (!error && remote && typeof remote === "object") {
        try {
          const remoteMenu = { ...remote, combos: Array.isArray(remote.combos) ? remote.combos : [] };
          setData(normalizeMenuData(remoteMenu));
          localStorage.removeItem(STORAGE_KEY);
          for (const key of LEGACY_KEYS) localStorage.removeItem(key);
        } catch {
          setStorageError("Supabase devolvió un menú con formato inválido; se conserva la copia local.");
        }
      } else if (error) {
        setStorageError("No se pudo cargar el menú online; se está usando la copia local.");
      }
      setRemoteReady(!error && !!remote);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      if (isSupabaseConfigured) {
        localStorage.removeItem(STORAGE_KEY);
        for (const key of LEGACY_KEYS) localStorage.removeItem(key);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      setStorageError(null);
    } catch {
      setStorageError(
        "No se pudieron guardar los últimos cambios: el almacenamiento del navegador está lleno. Quita algunas fotos o usa imágenes más pequeñas.",
      );
    }
    if (!isSupabaseConfigured || !remoteReady) return;
    const version = ++syncVersion.current;
    syncQueue.current = syncQueue.current.then(async () => {
      if (version !== syncVersion.current) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setStorageError("No hay una sesión de administrador activa. Inicia sesión nuevamente para guardar en Supabase.");
        return;
      }
      const payload = serializeMenuForSupabase(data);
      const settings = await supabase.from("settings").upsert(payload.settings, { onConflict: "id" });
      if (settings.error) throw settings.error;

      const deleteMissing = async (table: string, ids: string[]) => {
        const result = ids.length > 0
          ? await supabase.from(table).delete().not("id", "in", `(${ids.join(",")})`)
          : await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (result.error) throw result.error;
      };

      for (const [table, rows] of [
        ["categories", payload.categories],
        ["menu_items", payload.menuItems],
        ["item_extras", payload.itemExtras],
        ["item_sizes", payload.itemSizes],
        ["coupons", payload.coupons],
        ["combos", payload.combos],
      ] as const) {
        if (rows.length === 0) continue;
        const result = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (result.error) throw result.error;
      }
      await deleteMissing("item_extras", payload.itemExtras.map((row) => String(row.id)));
      await deleteMissing("item_sizes", payload.itemSizes.map((row) => String(row.id)));
      await deleteMissing("menu_items", payload.menuItems.map((row) => String(row.id)));
      await deleteMissing("categories", payload.categories.map((row) => String(row.id)));
      await deleteMissing("coupons", payload.coupons.map((row) => String(row.id)));
      await deleteMissing("combos", payload.combos.map((row) => String(row.id)));
      setStorageError(null);
    }).catch((error: unknown) => {
      const message =
        error && typeof error === "object" && "message" in error ? String(error.message) : String(error ?? "");
      if (/required_extra_selection|column .* does not exist|schema cache/i.test(message)) {
        setStorageError(
          "Supabase necesita la migración 20260908_required_extra_selection.sql. Ejecútala en SQL Editor para guardar estos cambios.",
        );
        return;
      }
      setStorageError("No se pudieron sincronizar los cambios con Supabase.");
    });
  }, [data, remoteReady, authVersion]);

  const setCategories = useCallback((updater: (prev: MenuCategory[]) => MenuCategory[]) => {
    setData((d) => ({ ...d, categories: updater(d.categories) }));
  }, []);

  const addCategory = useCallback(
    (input: CategoryInput): string => {
      const id = uid("cat");
      setCategories((prev) => [...prev, { ...input, id, items: [] }]);
      return id;
    },
    [setCategories],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<CategoryInput>) => {
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [setCategories],
  );

  const removeCategory = useCallback(
    (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id)),
    [setCategories],
  );

  const moveCategory = useCallback(
    (id: string, dir: -1 | 1) => {
      setCategories((prev) => swap(prev, prev.findIndex((c) => c.id === id), dir));
    },
    [setCategories],
  );

  const addItem = useCallback(
    (categoryId: string, input: ItemInput) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, items: [...c.items, { ...input, id: uid("item") }] } : c,
        ),
      );
    },
    [setCategories],
  );

  const updateItem = useCallback(
    (categoryId: string, itemId: string, patch: Partial<ItemInput>) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
            : c,
        ),
      );
    },
    [setCategories],
  );

  const removeItem = useCallback(
    (categoryId: string, itemId: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c,
        ),
      );
    },
    [setCategories],
  );

  const moveItem = useCallback(
    (categoryId: string, itemId: string, dir: -1 | 1) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, items: swap(c.items, c.items.findIndex((i) => i.id === itemId), dir) }
            : c,
        ),
      );
    },
    [setCategories],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  /* ---------- Sección de temporada ---------- */

  const setSeasonal = useCallback((updater: (prev: SeasonalSection) => SeasonalSection) => {
    setData((d) => ({ ...d, seasonal: updater(d.seasonal) }));
  }, []);

  const updateSeasonal = useCallback(
    (patch: Partial<Pick<SeasonalSection, "enabled" | "title" | "note">>) => {
      setSeasonal((prev) => ({ ...prev, ...patch }));
    },
    [setSeasonal],
  );

  const addSeasonalItem = useCallback(
    (input: ItemInput) => {
      setSeasonal((prev) => ({ ...prev, items: [...prev.items, { ...input, id: uid("item") }] }));
    },
    [setSeasonal],
  );

  const updateSeasonalItem = useCallback(
    (id: string, patch: Partial<ItemInput>) => {
      setSeasonal((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }));
    },
    [setSeasonal],
  );

  const removeSeasonalItem = useCallback(
    (id: string) => {
      setSeasonal((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    },
    [setSeasonal],
  );

  const moveSeasonalItem = useCallback(
    (id: string, dir: -1 | 1) => {
      setSeasonal((prev) => ({
        ...prev,
        items: swap(prev.items, prev.items.findIndex((i) => i.id === id), dir),
      }));
    },
    [setSeasonal],
  );

  /* ---------- Bebidas del día ---------- */

  const setBebidas = useCallback((updater: (prev: BebidasSection) => BebidasSection) => {
    setData((d) => ({ ...d, bebidas: updater(d.bebidas) }));
  }, []);

  const updateBebidas = useCallback(
    (patch: Partial<Pick<BebidasSection, "enabled" | "title" | "note">>) => {
      setBebidas((prev) => ({ ...prev, ...patch }));
    },
    [setBebidas],
  );

  const addBebida = useCallback(
    (input: ItemInput) => {
      setBebidas((prev) => ({ ...prev, items: [...prev.items, { ...input, id: uid("item") }] }));
    },
    [setBebidas],
  );

  const updateBebida = useCallback(
    (id: string, patch: Partial<ItemInput>) => {
      setBebidas((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }));
    },
    [setBebidas],
  );

  const removeBebida = useCallback(
    (id: string) => {
      setBebidas((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    },
    [setBebidas],
  );

  const moveBebida = useCallback(
    (id: string, dir: -1 | 1) => {
      setBebidas((prev) => ({
        ...prev,
        items: swap(prev.items, prev.items.findIndex((i) => i.id === id), dir),
      }));
    },
    [setBebidas],
  );

  const addCombo = useCallback((combo: Omit<Combo, "id">) => {
    setData((d) => ({ ...d, combos: [...d.combos, { ...combo, id: uid("combo") }] }));
  }, []);

  const updateCombo = useCallback((id: string, patch: Partial<Omit<Combo, "id">>) => {
    setData((d) => ({ ...d, combos: d.combos.map((combo) => (combo.id === id ? { ...combo, ...patch } : combo)) }));
  }, []);

  const removeCombo = useCallback((id: string) => {
    setData((d) => ({ ...d, combos: d.combos.filter((combo) => combo.id !== id) }));
  }, []);

  const moveCombo = useCallback((id: string, dir: -1 | 1) => {
    setData((d) => ({ ...d, combos: swap(d.combos, d.combos.findIndex((combo) => combo.id === id), dir) }));
  }, []);

  /* ---------- Cupones ---------- */

  const addCoupon = useCallback(
    (input: Omit<Coupon, "id" | "used">): string => {
      const id = uid("cupon");
      setData((d) => ({ ...d, coupons: [...d.coupons, { ...input, id, used: 0 }] }));
      return id;
    },
    [],
  );

  const updateCoupon = useCallback((id: string, patch: Partial<Omit<Coupon, "id" | "used">>) => {
    setData((d) => ({
      ...d,
      coupons: d.coupons.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCoupon = useCallback((id: string) => {
    setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) }));
  }, []);

  /** Suma un uso al confirmar un pedido con el cupón aplicado */
  const redeemCoupon = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      coupons: d.coupons.map((c) => (c.id === id ? { ...c, used: c.used + 1 } : c)),
    }));
  }, []);

  const exportJson = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importJson = useCallback((json: string): string | null => {
    try {
      setData(normalizeMenuData(JSON.parse(json)));
      return null;
    } catch (e) {
      if (e instanceof SyntaxError) return "El archivo no es un JSON válido";
      return e instanceof Error ? e.message : "No se pudo importar el archivo";
    }
  }, []);

  const reset = useCallback(() => setData(DEFAULT_MENU), []);

  return {
    categories: data.categories,
    seasonal: data.seasonal,
    bebidas: data.bebidas,
    combos: data.combos,
    coupons: data.coupons,
    settings: data.settings,
    storageError,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    updateSettings,
    updateSeasonal,
    addSeasonalItem,
    updateSeasonalItem,
    removeSeasonalItem,
    moveSeasonalItem,
    updateBebidas,
    addBebida,
    updateBebida,
    removeBebida,
    moveBebida,
    addCombo,
    updateCombo,
    removeCombo,
    moveCombo,
    addCoupon,
    updateCoupon,
    removeCoupon,
    redeemCoupon,
    exportJson,
    importJson,
    reset,
  };
}

export type MenuStore = ReturnType<typeof useMenuStore>;
