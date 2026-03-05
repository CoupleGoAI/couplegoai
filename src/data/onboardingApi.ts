import { invokeEdgeFunction } from '@data/apiClient';
import { supabase } from '@data/supabase';

// ─── Response Shapes ─────────────────────────────────────────────────────────

export interface OnboardingStatusResponse {
  completed: boolean;
  currentQuestion: number;
}

export interface OnboardingMessageResponse {
  reply: string;
  questionIndex: number;
  isComplete: boolean;
}

export interface OnboardingHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Check whether the current user has completed onboarding.
 * Reads directly from Supabase — no edge function needed for simple status.
 *
 * - `completed` is read from the `profiles.onboarding_completed` column.
 * - `currentQuestion` is derived from the count of user messages in the
 *   `messages` table with `conversation_type = 'onboarding'`.
 */
export async function getOnboardingStatus(): Promise<ApiResult<OnboardingStatusResponse>> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { ok: false, error: 'Session unavailable. Please sign in again.' };
    }

    const userId = userData.user.id;

    // Fetch profile to check completion status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { ok: false, error: 'Failed to load onboarding status.' };
    }

    const completed = (profile?.onboarding_completed as boolean) ?? false;

    if (completed) {
      return { ok: true, data: { completed: true, currentQuestion: 0 } };
    }

    // Count user messages to determine current question index
    const { count, error: countError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('conversation_type', 'onboarding')
      .eq('role', 'user');

    if (countError) {
      return { ok: false, error: 'Failed to load onboarding status.' };
    }

    return { ok: true, data: { completed: false, currentQuestion: count ?? 0 } };
  } catch {
    return { ok: false, error: 'Failed to load onboarding status.' };
  }
}

/**
 * Send the user's message to the AI onboarding conversation.
 * An empty string triggers the initial greeting from the AI.
 *
 * Uses the `onboarding-chat` Supabase Edge Function which handles
 * AI processing, question validation, and message persistence.
 */
export async function sendOnboardingMessage(
  message: string,
): Promise<ApiResult<OnboardingMessageResponse>> {
  return invokeEdgeFunction<OnboardingMessageResponse>('onboarding-chat', { message });
}

/**
 * Fetch conversation history from `public.messages` for a given user.
 * Used to resume mid-onboarding sessions.
 * Reads directly from Supabase — no edge function needed.
 * Input: validated userId (never derived from untrusted sources).
 */
export async function fetchOnboardingHistory(
  userId: string,
): Promise<ApiResult<OnboardingHistoryItem[]>> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .eq('conversation_type', 'onboarding')
      .order('created_at', { ascending: true });

    if (error) return { ok: false, error: 'Failed to load conversation history.' };
    if (!data) return { ok: true, data: [] };

    // Validate and sanitize role field — only trust known values from the DB schema
    const validated: OnboardingHistoryItem[] = data
      .filter(
        (item): item is { id: string; role: string; content: string; created_at: string } =>
          typeof item.id === 'string' &&
          typeof item.role === 'string' &&
          typeof item.content === 'string' &&
          typeof item.created_at === 'string',
      )
      .map((item) => ({
        id: item.id,
        role: item.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: item.content,
        created_at: item.created_at,
      }));

    return { ok: true, data: validated };
  } catch {
    return { ok: false, error: 'Failed to load conversation history.' };
  }
}
