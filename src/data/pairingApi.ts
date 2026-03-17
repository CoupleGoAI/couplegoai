// =============================================================================
// pairingApi.ts — Edge function calls for couple pairing
//
// Uses plain fetch (not supabase.functions.invoke) with explicit Authorization
// and apikey headers to avoid the supabase-js-react-native bug that strips
// the Authorization header.
//
// SECURITY: no tokens, pairing payloads, or full response bodies are logged.
// Error messages are generic — no internal details surfaced to the UI.
// =============================================================================

import { supabase } from '@data/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PairingGenerateResponse {
  token: string;
  expiresAt: string;
}

export interface PairingConnectResponse {
  couple: {
    id: string;
    createdAt: string;
  };
  partner: {
    id: string;
    name: string | null;
  };
}

export interface PairingDisconnectResponse {
  ok: true;
}

export interface CoupleStatus {
  isPaired: boolean;
  coupleId: string | null;
  partner: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
}

type PairingResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ─── HTTP status → user-facing message ────────────────────────────────────────

function mapHttpError(status: number, serverMsg?: string): string {
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 409) return 'You or your partner are already connected to someone.';
  if (status === 410) return 'This code has expired. Ask your partner to generate a new one.';
  if (status === 400) {
    if (typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('yourself')) {
      return "You can't pair with yourself!";
    }
    return 'Invalid request.';
  }
  return 'Request failed. Please try again.';
}

// ─── Shared fetch helper ───────────────────────────────────────────────────────

async function callPairingFunction<T>(
  functionName: string,
  body?: Record<string, unknown>,
): Promise<PairingResult<T>> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.access_token) {
      return { ok: false, error: 'Session expired. Please sign in again.' };
    }

    const accessToken = sessionData.session.access_token;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body ?? {}),
      },
    );

    const data = await response.json() as T & { error?: string };

    if (!response.ok) {
      return {
        ok: false,
        error: mapHttpError(response.status, data.error),
      };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Generate a new pairing token via the pairing-generate edge function. */
export async function generateToken(): Promise<PairingResult<PairingGenerateResponse>> {
  return callPairingFunction<PairingGenerateResponse>('pairing-generate');
}

/**
 * Connect with a partner by submitting a scanned QR token.
 * MUST-7: QR payload contains only the token string — no PII.
 */
export async function connectWithToken(
  token: string,
): Promise<PairingResult<PairingConnectResponse>> {
  return callPairingFunction<PairingConnectResponse>('pairing-connect', { token });
}

/** Disconnect from the current partner. Idempotent. */
export async function disconnect(): Promise<PairingResult<PairingDisconnectResponse>> {
  return callPairingFunction<PairingDisconnectResponse>('pairing-disconnect');
}

/**
 * Subscribe to Supabase Realtime UPDATE events on the current user's profile row.
 * Fires `onCoupleIdReceived` the moment another user's scan causes `couple_id`
 * to be set on this profile (via the pairing-connect edge function).
 *
 * The caller is responsible for invoking the returned cleanup function when
 * the subscription is no longer needed (e.g. on screen unmount).
 *
 * SECURITY: filter is by the authenticated user's own profile id — no foreign
 * data is received through this channel.
 */
export function subscribeToPartnerConnected(
  userId: string,
  onCoupleIdReceived: (coupleId: string) => void,
): () => void {
  const channel = supabase
    .channel(`profile-pairing-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const newProfile = payload.new as { couple_id?: string | null };
        if (newProfile.couple_id) {
          onCoupleIdReceived(newProfile.couple_id);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Fetch couple status via direct DB query (read-only — no edge function needed).
 * Returns partner info from the profiles table via RLS-enforced join.
 */
export async function fetchCoupleStatus(): Promise<PairingResult<CoupleStatus>> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('couple_id')
      .single();

    if (profileError) {
      return { ok: false, error: 'Failed to read profile.' };
    }

    const coupleId = (profile as { couple_id: string | null } | null)?.couple_id ?? null;

    if (!coupleId) {
      return { ok: true, data: { isPaired: false, coupleId: null, partner: null } };
    }

    // Fetch couple + partner profile
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner1_id, partner2_id, is_active')
      .eq('id', coupleId)
      .eq('is_active', true)
      .single();

    if (coupleError || !couple) {
      return { ok: true, data: { isPaired: false, coupleId: null, partner: null } };
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    const c = couple as {
      id: string;
      partner1_id: string;
      partner2_id: string;
      is_active: boolean;
    };

    const partnerId = c.partner1_id === userId ? c.partner2_id : c.partner1_id;

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', partnerId)
      .single();

    const pp = partnerProfile as { id: string; name: string | null; avatar_url: string | null } | null;

    return {
      ok: true,
      data: {
        isPaired: true,
        coupleId,
        partner: {
          id: partnerId,
          name: pp?.name ?? null,
          avatarUrl: pp?.avatar_url ?? null,
        },
      },
    };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection.' };
  }
}
