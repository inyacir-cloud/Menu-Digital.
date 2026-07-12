import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value?: string) {
  if (!value) return undefined;

  return value.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseBucket = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined)?.trim() || 'product-images';

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;