import { initialCategories, initialComplements, initialConfig, initialProducts } from '../data';
import type { BusinessConfig, Category, Complement, Product } from '../types';
import { supabase, supabaseBucket } from './supabase';

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category_id: string;
  complement_ids: string[] | null;
  is_daily_water: boolean | null;
  is_available: boolean | null;
  sizes: Product['sizes'] | null;
};

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number | null;
};

type BusinessConfigRow = {
  id: string;
  name: string;
  is_open: boolean;
  phone: string;
  schedule: string;
  address: string | null;
  description: string | null;
  logo: string | null;
  social_media: BusinessConfig['socialMedia'] | null;
  service_type: BusinessConfig['serviceType'] | null;
  delivery_radius: string | null;
  hours: BusinessConfig['hours'] | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase no está configurado.');
  }

  return supabase;
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image: row.image,
    categoryId: row.category_id,
    complementIds: row.complement_ids || [],
    isDailyWater: row.is_daily_water ?? undefined,
    isAvailable: row.is_available ?? undefined,
    sizes: row.sizes || undefined,
  };
}

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || undefined,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapCategoryToRow(category: Category): CategoryRow {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon || null,
    sort_order: category.sortOrder ?? 0,
  };
}

function mapProductToRow(product: Product): ProductRow {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category_id: product.categoryId,
    complement_ids: product.complementIds || [],
    is_daily_water: product.isDailyWater ?? false,
    is_available: product.isAvailable ?? true,
    sizes: product.sizes || null,
  };
}

function mapBusinessConfigRow(row: BusinessConfigRow | null): BusinessConfig {
  if (!row) return initialConfig;

  return {
    ...initialConfig,
    name: row.name,
    isOpen: row.is_open,
    phone: row.phone,
    schedule: row.schedule,
    address: row.address || undefined,
    description: row.description || undefined,
    logo: row.logo || undefined,
    socialMedia: row.social_media || undefined,
    serviceType: row.service_type || undefined,
    deliveryRadius: row.delivery_radius || undefined,
    hours: row.hours || undefined,
  };
}

function mapBusinessConfigToRow(config: BusinessConfig): BusinessConfigRow {
  return {
    id: 'main',
    name: config.name,
    is_open: config.isOpen,
    phone: config.phone,
    schedule: config.schedule,
    address: config.address || null,
    description: config.description || null,
    logo: config.logo || null,
    social_media: config.socialMedia || null,
    service_type: config.serviceType || null,
    delivery_radius: config.deliveryRadius || null,
    hours: config.hours || null,
  };
}

export async function loadSupabaseData() {
  const client = requireSupabase();

  const [configRes, categoriesRes, productsRes, complementsRes] = await Promise.all([
    client.from('business_config').select('*').eq('id', 'main').maybeSingle<BusinessConfigRow>(),
    client.from('categories').select('*').order('sort_order', { ascending: true }).returns<CategoryRow[]>(),
    client.from('products').select('*').returns<ProductRow[]>(),
    client.from('complements').select('*').returns<Complement[]>(),
  ]);

  if (configRes.error) throw configRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  if (productsRes.error) throw productsRes.error;
  if (complementsRes.error) throw complementsRes.error;

  return {
    config: mapBusinessConfigRow(configRes.data),
    categories: (categoriesRes.data || initialCategories).map((category) =>
      'sort_order' in category ? mapCategoryRow(category as CategoryRow) : category
    ),
    products: (productsRes.data || []).map(mapProductRow),
    complements: complementsRes.data || initialComplements,
  };
}

export async function saveSupabaseConfig(config: BusinessConfig) {
  const client = requireSupabase();
  const { error } = await client.from('business_config').upsert(mapBusinessConfigToRow(config));
  if (error) throw error;
}

export async function saveSupabaseCategory(category: Category) {
  const client = requireSupabase();
  const { error } = await client.from('categories').upsert(mapCategoryToRow(category));
  if (error) throw error;
}

export async function deleteSupabaseCategory(id: string) {
  const client = requireSupabase();
  const productsDelete = await client.from('products').delete().eq('category_id', id);
  if (productsDelete.error) throw productsDelete.error;
  const categoryDelete = await client.from('categories').delete().eq('id', id);
  if (categoryDelete.error) throw categoryDelete.error;
}

export async function saveSupabaseProduct(product: Product) {
  const client = requireSupabase();
  const { error } = await client.from('products').upsert(mapProductToRow(product));
  if (error) throw error;
}

export async function deleteSupabaseProduct(id: string) {
  const client = requireSupabase();
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function saveSupabaseComplement(complement: Complement) {
  const client = requireSupabase();
  const { error } = await client.from('complements').upsert(complement);
  if (error) throw error;
}

export async function deleteSupabaseComplement(id: string) {
  const client = requireSupabase();
  const { error } = await client.from('complements').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadSupabaseProductImage(file: File) {
  const client = requireSupabase();
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'png';
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  const path = `products/${Date.now()}-${safeName || `image.${extension}`}`;

  const upload = await client.storage.from(supabaseBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (upload.error) throw upload.error;

  const { data } = client.storage.from(supabaseBucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function resetSupabaseData() {
  const client = requireSupabase();

  const deleteProducts = await client.from('products').delete().neq('id', '__never__');
  if (deleteProducts.error) throw deleteProducts.error;

  const deleteCategories = await client.from('categories').delete().neq('id', '__never__');
  if (deleteCategories.error) throw deleteCategories.error;

  const deleteComplements = await client.from('complements').delete().neq('id', '__never__');
  if (deleteComplements.error) throw deleteComplements.error;

  const seedCategories = await client.from('categories').insert(initialCategories);
  if (seedCategories.error) throw seedCategories.error;

  const seedComplements = await client.from('complements').insert(initialComplements);
  if (seedComplements.error) throw seedComplements.error;

  const seedProducts = await client.from('products').insert(initialProducts.map(mapProductToRow));
  if (seedProducts.error) throw seedProducts.error;

  await saveSupabaseConfig(initialConfig);
}