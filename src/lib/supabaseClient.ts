import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: null | SupabaseClient | undefined;

/**
 * Returns a Supabase browser client when env vars are set; otherwise null.
 * CRA reads `REACT_APP_*` at build time.
 */
export function getSupabase(): null | SupabaseClient {
  if (cached !== undefined) {
    return cached;
  }

  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    cached = null;

    return null;
  }

  cached = createClient(url, anonKey);

  return cached;
}
