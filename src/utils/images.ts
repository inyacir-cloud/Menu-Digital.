import type { SyntheticEvent } from 'react';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;
  return value.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseBucket = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined)?.trim() || 'product-images';
const supabaseDefaultLogo = supabaseUrl
  ? `${supabaseUrl}/storage/v1/object/public/${supabaseBucket}/defaults/logo.png`
  : undefined;

export const DEFAULT_PRODUCT_IMAGE = supabaseDefaultLogo || '/Logo.png';

export function handleProductImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = DEFAULT_PRODUCT_IMAGE;
  image.classList.add('object-contain', 'bg-white', 'p-2');
}