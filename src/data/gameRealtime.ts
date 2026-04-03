import { supabase } from '@data/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type ChangeCallback = () => void;

/**
 * Subscribe to game invitation changes for a couple.
 * Calls `onUpdate` on any INSERT or UPDATE to game_invitations for the couple.
 */
export function subscribeToInvitations(
  coupleId: string,
  onUpdate: ChangeCallback,
): RealtimeChannel {
  const channel = supabase
    .channel(`game-invitations:${coupleId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_invitations',
        filter: `couple_id=eq.${coupleId}`,
      },
      onUpdate,
    )
    .subscribe();

  return channel;
}

/**
 * Subscribe to all session-related changes for an active session.
 * Monitors game_sessions, game_session_players, game_rounds, and game_answers.
 * Calls `onUpdate` on any change — the consumer should refetch the full snapshot.
 */
export function subscribeToSession(
  sessionId: string,
  onUpdate: ChangeCallback,
): RealtimeChannel {
  const channel = supabase
    .channel(`game-session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      onUpdate,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_session_players',
        filter: `session_id=eq.${sessionId}`,
      },
      onUpdate,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rounds',
        filter: `session_id=eq.${sessionId}`,
      },
      onUpdate,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_answers',
        filter: `session_id=eq.${sessionId}`,
      },
      onUpdate,
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe and remove a realtime channel.
 */
export function unsubscribeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
