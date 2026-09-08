import type { Coupon, MenuData, MenuItem, Settings, Theme } from "../types";

const SUPABASE_ID_MAP_KEY = "egf-menu-supabase-id-map-v1";

function getIdMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SUPABASE_ID_MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveIdMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SUPABASE_ID_MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore storage write failure; sync can still proceed with an in-memory map
  }
}

function toUuidId(localId: string | undefined, map: Record<string, string>, fallback: string): string {
  if (!localId) return fallback;
  if (map[localId]) return map[localId];
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(localId)) {
    map[localId] = localId;
    return localId;
  }
  const uuid = crypto.randomUUID();
  map[localId] = uuid;
  return uuid;
}

export type MenuSyncPayload = {
  settings: {
    id: number;
    name: string;
    tagline: string;
    welcome: string;
    logo: string | null;
    whatsapp_number: string;
    whatsapp_display: string;
    delivery_note: string;
    contact_message: string;
    hours: string;
    address: string;
    facebook: string;
    is_open: boolean;
    closed_note: string;
    message_template: string;
    payments: Settings["payments"];
    theme: Theme;
    seasonal_enabled: boolean;
    seasonal_title: string;
    seasonal_note: string;
    bebidas_enabled: boolean;
    bebidas_title: string;
    bebidas_note: string;
  };
  categories: Array<{
    id?: string;
    title: string;
    description?: string | null;
    image?: string | null;
    image_alt?: string | null;
    image_side: "left" | "right";
    blend?: boolean;
    layout?: "list" | "grid";
    sort_order: number;
  }>;
  menuItems: Array<{
    id?: string;
    section: "category" | "seasonal" | "bebidas";
    category_id?: string | null;
    name: string;
    price: number;
    description?: string | null;
    badge?: string | null;
    cart_name?: string | null;
    image?: string | null;
    unavailable?: boolean;
    sort_order: number;
  }>;
  itemExtras: Array<{
    id?: string;
    item_id: string;
    name: string;
    price: number;
    sort_order: number;
  }>;
  itemSizes: Array<{
    id?: string;
    item_id: string;
    name: string;
    price: number;
    unavailable?: boolean;
    sort_order: number;
  }>;
  coupons: Array<{
    id?: string;
    code: string;
    type: Coupon["type"];
    value: number;
    enabled: boolean;
    max_uses: number;
    used: number;
    expires_at?: string | null;
    min_order?: number | null;
  }>;
  itemsByProduct: Array<{ itemId: string; unavailableSizes: string[] }>;
};

function normalizeItem(item: MenuItem, section: "category" | "seasonal" | "bebidas", categoryId?: string | null, index = 0) {
  return {
    id: item.id,
    section,
    category_id: categoryId ?? null,
    name: item.name,
    price: item.price,
    description: item.description ?? null,
    badge: item.badge ?? null,
    cart_name: item.cartName ?? null,
    image: item.image ?? null,
    unavailable: Boolean(item.unavailable),
    sort_order: index,
  };
}

export function buildMenuSyncPayload(data: MenuData): MenuSyncPayload {
  const idMap = getIdMap();

  const categories = data.categories.map((category, index) => ({
    id: toUuidId(category.id, idMap, `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`),
    title: category.title,
    description: category.description ?? null,
    image: category.image ?? null,
    image_alt: category.imageAlt ?? null,
    image_side: category.imageSide,
    blend: category.blend ?? true,
    layout: category.layout ?? "list",
    sort_order: index,
  }));

  const menuItems: MenuSyncPayload["menuItems"] = [];
  const itemExtras: MenuSyncPayload["itemExtras"] = [];
  const itemSizes: MenuSyncPayload["itemSizes"] = [];
  const itemsByProduct: MenuSyncPayload["itemsByProduct"] = [];

  for (const category of data.categories) {
    const categoryRemoteId = toUuidId(category.id, idMap, `00000000-0000-4000-8000-${String(categories.findIndex((c) => c.title === category.title)).padStart(12, "0")}`);
    for (const item of category.items) {
      const itemRemoteId = toUuidId(item.id, idMap, crypto.randomUUID());
      menuItems.push({
        ...normalizeItem(item, "category", categoryRemoteId, menuItems.length),
        id: itemRemoteId,
      });
      if (item.extras) {
        for (const extra of item.extras) {
          const extraRemoteId = toUuidId(`${item.id}:extra:${extra.id}`, idMap, crypto.randomUUID());
          itemExtras.push({
            id: extraRemoteId,
            item_id: itemRemoteId,
            name: extra.name,
            price: extra.price,
            sort_order: itemExtras.length,
          });
        }
      }
      if (item.sizes) {
        for (const size of item.sizes) {
          const sizeRemoteId = toUuidId(`${item.id}:size:${size.id}`, idMap, crypto.randomUUID());
          itemSizes.push({
            id: sizeRemoteId,
            item_id: itemRemoteId,
            name: size.name,
            price: size.price,
            unavailable: Boolean(item.unavailableSizes?.includes(size.id)),
            sort_order: itemSizes.length,
          });
        }
      }
      itemsByProduct.push({
        itemId: itemRemoteId,
        unavailableSizes: item.unavailableSizes ?? [],
      });
    }
  }

  const seasonalItems = data.seasonal.items.map((item, index) => {
    const itemRemoteId = toUuidId(item.id, idMap, crypto.randomUUID());
    return {
      ...normalizeItem(item, "seasonal", null, index),
      id: itemRemoteId,
    };
  });
  const bebidasItems = data.bebidas.items.map((item, index) => {
    const itemRemoteId = toUuidId(item.id, idMap, crypto.randomUUID());
    return {
      ...normalizeItem(item, "bebidas", null, index),
      id: itemRemoteId,
    };
  });

  for (const item of seasonalItems) menuItems.push(item);
  for (const item of bebidasItems) menuItems.push(item);

  for (const item of [...data.seasonal.items, ...data.bebidas.items]) {
    const itemRemoteId = toUuidId(item.id, idMap, crypto.randomUUID());
    if (item.extras) {
      for (const extra of item.extras) {
        const extraRemoteId = toUuidId(`${item.id}:extra:${extra.id}`, idMap, crypto.randomUUID());
        itemExtras.push({
          id: extraRemoteId,
          item_id: itemRemoteId,
          name: extra.name,
          price: extra.price,
          sort_order: itemExtras.length,
        });
      }
    }
    if (item.sizes) {
      for (const size of item.sizes) {
        const sizeRemoteId = toUuidId(`${item.id}:size:${size.id}`, idMap, crypto.randomUUID());
        itemSizes.push({
          id: sizeRemoteId,
          item_id: itemRemoteId,
          name: size.name,
          price: size.price,
          unavailable: Boolean(item.unavailableSizes?.includes(size.id)),
          sort_order: itemSizes.length,
        });
      }
    }
    itemsByProduct.push({
      itemId: itemRemoteId,
      unavailableSizes: item.unavailableSizes ?? [],
    });
  }

  saveIdMap(idMap);

  return {
    settings: {
      id: 1,
      name: data.settings.name,
      tagline: data.settings.tagline,
      welcome: data.settings.welcome,
      logo: data.settings.logo ?? null,
      whatsapp_number: data.settings.whatsappNumber,
      whatsapp_display: data.settings.whatsappDisplay,
      delivery_note: data.settings.deliveryNote,
      contact_message: data.settings.contactMessage,
      hours: data.settings.hours,
      address: data.settings.address,
      facebook: data.settings.facebook,
      is_open: data.settings.open,
      closed_note: data.settings.closedNote,
      message_template: data.settings.messageTemplate,
      payments: data.settings.payments,
      theme: data.settings.theme,
      seasonal_enabled: data.seasonal.enabled,
      seasonal_title: data.seasonal.title,
      seasonal_note: data.seasonal.note,
      bebidas_enabled: data.bebidas.enabled,
      bebidas_title: data.bebidas.title,
      bebidas_note: data.bebidas.note,
    },
    categories,
    menuItems,
    itemExtras,
    itemSizes,
    coupons: data.coupons.map((coupon) => ({
      id: toUuidId(coupon.id, idMap, crypto.randomUUID()),
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      enabled: coupon.enabled,
      max_uses: coupon.maxUses,
      used: coupon.used,
      expires_at: coupon.expiresAt ?? null,
      min_order: coupon.minOrder ?? null,
    })),
    itemsByProduct,
  };
}

export function serializeMenuForSupabase(data: MenuData): MenuSyncPayload {
  return buildMenuSyncPayload(data);
}
