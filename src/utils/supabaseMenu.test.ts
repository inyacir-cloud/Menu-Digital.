import test from "node:test";
import assert from "node:assert/strict";

import { buildMenuSyncPayload } from "./supabaseMenu.ts";

test("buildMenuSyncPayload includes settings, categories, items, extras, sizes and coupons", () => {
  const payload = buildMenuSyncPayload({
    categories: [
      {
        id: "cat-1",
        title: "Tacos",
        imageSide: "right",
        items: [
          {
            id: "item-1",
            name: "Arrachera",
            price: 40,
            extras: [{ id: "extra-1", name: "Con Queso +", price: 7 }],
            sizes: [{ id: "size-1", name: "Medio", price: 10 }],
            unavailableSizes: ["size-1"],
          },
        ],
      },
    ],
    seasonal: { enabled: true, title: "Temporada", note: "Pregunta", items: [] },
    bebidas: { enabled: true, title: "Bebidas", note: "Nada", items: [] },
    coupons: [{ id: "cp-1", code: "SAVE10", type: "percent", value: 10, enabled: true, maxUses: 1, used: 0 }],
    settings: {
      name: "Negocio",
      tagline: "Test",
      welcome: "Bienvenidos",
      whatsappNumber: "521234567890",
      whatsappDisplay: "1234567890",
      deliveryNote: "Entrega",
      hours: "9 a 9",
      address: "Calle 1",
      facebook: "",
      payments: [{ id: "efectivo", label: "Efectivo", enabled: true, details: "" }],
      messageTemplate: "Hola {nombre}",
      contactMessage: "Hola",
      theme: { background: "#ffffff", text: "#111111", primary: "#ffdd00", secondary: "#ff751f" },
      open: true,
      closedNote: "Cerrado",
      logo: undefined,
    },
  });

  assert.equal(payload.settings.id, 1);
  assert.equal(payload.categories.length, 1);
  assert.equal(payload.menuItems.length, 1);
  assert.equal(payload.itemExtras.length, 1);
  assert.equal(payload.itemSizes.length, 1);
  assert.equal(payload.coupons.length, 1);
  assert.match(payload.itemsByProduct[0].itemId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("buildMenuSyncPayload keeps seasonal and beverage items and unique child ids", () => {
  const item = (id: string, name: string) => ({
    id,
    name,
    price: 20,
    sizes: [
      { id: "med", name: "Medio litro", price: 20 },
      { id: "litro", name: "Litro", price: 35 },
    ],
  });
  const base = {
    categories: [],
    seasonal: { enabled: true, title: "Temporada", note: "Pregunta", items: [item("seasonal-1", "Birria")] },
    bebidas: { enabled: true, title: "Bebidas", note: "Hoy", items: [item("drink-1", "Horchata"), item("drink-2", "Jamaica")] },
    coupons: [],
    settings: {
      name: "Negocio",
      tagline: "Test",
      welcome: "Bienvenidos",
      whatsappNumber: "521234567890",
      whatsappDisplay: "1234567890",
      deliveryNote: "Entrega",
      hours: "9 a 9",
      address: "Calle 1",
      facebook: "",
      payments: [],
      messageTemplate: "Hola",
      contactMessage: "Hola",
      theme: { background: "#ffffff", text: "#111111", primary: "#ffdd00", secondary: "#ff751f" },
      open: true,
      closedNote: "Cerrado",
      logo: undefined,
    },
  };

  const payload = buildMenuSyncPayload(base);
  assert.deepEqual(payload.menuItems.map((entry) => entry.section), ["seasonal", "bebidas", "bebidas"]);
  assert.equal(new Set(payload.itemSizes.map((size) => size.id)).size, payload.itemSizes.length);
  assert.equal(payload.itemSizes.length, 6);
});
