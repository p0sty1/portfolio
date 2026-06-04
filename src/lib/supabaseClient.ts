import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: null | SupabaseClient | undefined;

const FALLBACK_SUPABASE_URL = 'https://nhwlsrnvdxzhygudhhuj.supabase.co';
const FALLBACK_SUPABASE_KEY = 'sb_publishable_XlNWu12aXeKS_HIKf0DWwA_BG3ysdJC';

/**
 * Returns a Supabase browser client.
 * Env vars override the committed public project URL/key for alternate builds.
 */
export function getSupabase(): null | SupabaseClient {
  if (cached !== undefined) {
    return cached;
  }

  const url = process.env.REACT_APP_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const anonKey =
    process.env.REACT_APP_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_KEY;

  if (!url || !anonKey) {
    cached = null;

    return null;
  }

  cached = createClient(url, anonKey);

  return cached;
}
