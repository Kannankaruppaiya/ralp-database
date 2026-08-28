import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client holding the service role key, which bypasses row level
 * security entirely. Import this only from route handlers under app/api —
 * anything that reaches a client bundle would publish the key.
 */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
