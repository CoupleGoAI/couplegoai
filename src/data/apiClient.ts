import { supabase } from '@data/supabase';

/**
 * Typed wrapper for Supabase PostgREST queries.
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

/**
 * Typed wrapper for Supabase Edge Function invocations.
 *
 * - Uses `supabase.functions.invoke()` which automatically attaches the
 *   session's Bearer token and routes to the correct Supabase project URL.
 * - Returns a discriminated Result<T, string> — never throws.
 * - SECURITY: tokens are managed internally by supabase-js; never logged.
 *   Only generic error messages surface to the caller.
 */
export async function invokeEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body ?? {},
    });

    if (error) {
      const msg = typeof error.message === 'string' ? error.message : '';
      if (msg.includes('JWT') || msg.includes('401') || msg.includes('auth'))
        return { ok: false, error: 'Session expired. Please sign in again.' };
      if (msg.includes('403') || msg.includes('forbidden'))
        return { ok: false, error: 'You do not have access to this resource.' };
      return { ok: false, error: 'Request failed. Please try again.' };
    }

    if (data === null || data === undefined) {
      return { ok: false, error: 'No data returned' };
    }

    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

export { supabase };
