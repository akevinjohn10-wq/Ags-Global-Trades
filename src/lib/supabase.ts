import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Null when the environment variables are missing (e.g. a preview build without them),
// so the page still renders and enquiries fall back to email delivery only.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
