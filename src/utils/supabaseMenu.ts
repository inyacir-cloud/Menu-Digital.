import type { MenuData, MenuItem } from "../types";

const ID_MAP_KEY = "egf-menu-supabase-id-map-v1";

type IdMap = Record<string, string>;

export interface MenuSyncPayload {
	settings: Record<string, unknown>;
	categories: Array<Record<string, unknown>>;
	menuItems: Array<Record<string, unknown>>;
	itemExtras: Array<Record<string, unknown>>;
	itemSizes: Array<Record<string, unknown>>;
	coupons: Array<Record<string, unknown>>;
	combos: Array<Record<string, unknown>>;
}

function readIdMap(): IdMap {
	try {
		const raw = localStorage.getItem(ID_MAP_KEY);
		return raw ? (JSON.parse(raw) as IdMap) : {};
	} catch {
		return {};
	}
}

function uuidFor(id: string, map: IdMap): string {
	if (map[id]) return map[id];
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
		map[id] = id;
		return id;
	}
	const uuid = crypto.randomUUID();
	map[id] = uuid;
	return uuid;
}

function itemRow(item: MenuItem, section: "category" | "seasonal" | "bebidas", categoryId: string | null, id: string, sortOrder: number) {
	return {
		id,
		section,
		category_id: categoryId,
		name: item.name,
		price: item.price,
		description: item.description ?? null,
		badge: item.badge ?? null,
		cart_name: item.cartName ?? null,
		image: item.image ?? null,
		unavailable: Boolean(item.unavailable),
		required_extra_selection: Boolean(item.requiredExtraSelection),
		sort_order: sortOrder,
	};
}

export function buildMenuSyncPayload(data: MenuData): MenuSyncPayload {
	const map = readIdMap();
	const categories: Array<Record<string, unknown>> = [];
	const menuItems: Array<Record<string, unknown>> = [];
	const itemExtras: Array<Record<string, unknown>> = [];
	const itemSizes: Array<Record<string, unknown>> = [];

	const addItem = (item: MenuItem, section: "category" | "seasonal" | "bebidas", categoryId: string | null, sortOrder: number) => {
		const itemId = uuidFor(item.id, map);
		menuItems.push(itemRow(item, section, categoryId, itemId, sortOrder));
		for (const [index, extra] of (item.extras ?? []).entries()) {
			itemExtras.push({ id: uuidFor(`${item.id}:extra:${extra.id}`, map), item_id: itemId, name: extra.name, price: extra.price, sort_order: index });
		}
		for (const [index, size] of (item.sizes ?? []).entries()) {
			itemSizes.push({ id: uuidFor(`${item.id}:size:${size.id}`, map), item_id: itemId, name: size.name, price: size.price, unavailable: item.unavailableSizes?.includes(size.id) ?? false, sort_order: index });
		}
	};

	for (const [categoryIndex, category] of data.categories.entries()) {
		const categoryId = uuidFor(category.id, map);
		categories.push({ id: categoryId, title: category.title, description: category.description ?? null, image: category.image ?? null, image_alt: category.imageAlt ?? null, image_side: category.imageSide, blend: category.blend ?? true, layout: category.layout ?? "list", sort_order: categoryIndex });
		category.items.forEach((item, itemIndex) => addItem(item, "category", categoryId, itemIndex));
	}
	data.seasonal.items.forEach((item, index) => addItem(item, "seasonal", null, index));
	data.bebidas.items.forEach((item, index) => addItem(item, "bebidas", null, index));

	localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
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
		coupons: data.coupons.map((coupon) => ({ id: uuidFor(coupon.id, map), code: coupon.code, type: coupon.type, value: coupon.value, enabled: coupon.enabled, max_uses: coupon.maxUses, used: coupon.used, expires_at: coupon.expiresAt ?? null, min_order: coupon.minOrder ?? null })),
		combos: data.combos.map((combo, comboIndex) => ({
			id: uuidFor(combo.id, map),
			name: combo.name,
			price: combo.price,
			description: combo.description ?? null,
			badge: combo.badge ?? null,
			image: combo.image ?? null,
			enabled: combo.enabled,
			sort_order: comboIndex,
			groups: combo.groups.map((group, groupIndex) => ({
				id: uuidFor(`${combo.id}:group:${group.id}`, map),
				title: group.title,
				required: group.required,
				min_selections: group.minSelections,
				max_selections: group.maxSelections,
				selection_mode: group.selectionMode ?? "products",
				category_id: group.categoryId ?? null,
				category_title: group.categoryTitle ?? null,
				sort_order: groupIndex,
				options: group.options.map((option, optionIndex) => ({
					id: uuidFor(`${combo.id}:option:${option.id}`, map),
					item_id: uuidFor(option.itemId, map),
					label: option.label,
					category_title: option.categoryTitle ?? null,
					unavailable: Boolean(option.unavailable),
					sort_order: optionIndex,
				})),
			})),
		})),
	};
}

export const serializeMenuForSupabase = buildMenuSyncPayload;
