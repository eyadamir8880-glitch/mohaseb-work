import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project-id.supabase.co');

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
}

export function getSupabase() {
  if (!supabaseClient) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }
  return supabaseClient;
}

export default supabaseClient;
