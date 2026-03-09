// =============================================================================
// onboardingApi.ts — uses plain fetch to avoid supabase-js stripping the
// Authorization header in supabase-js-react-native (known bug).
// =============================================================================

import { supabase } from '@data/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export interface OnboardingResponse {
  reply: string;
  questionIndex: number;
  isComplete: boolean;
  error?: string;
  detail?: string;
}

/**
 * Send a message to the onboarding edge function.
 * Pass an empty string to get the current question (start or resume).
 */
export async function sendOnboardingMessage(
  message: string,
): Promise<{ ok: true; data: OnboardingResponse } | { ok: false; error: string }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.access_token) {
      return { ok: false, error: 'Not signed in' };
    }

    const token = sessionData.session.access_token;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/onboarding-chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ message }),
      },
    );

    const data = await response.json() as OnboardingResponse;

    console.log('[onboarding] response:', JSON.stringify(data));

    if (!response.ok || data.error) {
      console.error('[onboarding] error:', data.error, data.detail);
      return { ok: false, error: data.error ?? 'Request failed' };
    }

    return { ok: true, data };
  } catch (e) {
    console.error('[onboarding] unexpected error:', e);
    return { ok: false, error: 'Network error' };
  }
}