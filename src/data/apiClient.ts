import { supabase } from '@data/supabase';

/**
 * Typed wrapper for Supabase PostgREST + Edge Function calls.
 * Supabase JS automatically attaches the session's access token
 * to all requests — no manual header management needed.
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const { data, error } = await queryFn();
    if (error) return { ok: false, error: error.message };
    if (data === null) return { ok: false, error: 'No data returned' };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export { supabase };
