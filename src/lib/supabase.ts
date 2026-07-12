import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseBucket = (import.meta.env.VITE_SUPABASE_BUCKET as string | undefined)?.trim() || 'product-images';

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;