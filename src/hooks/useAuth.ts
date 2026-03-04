import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { useAppStore } from '@store/appStore';
import { useChatStore } from '@store/chatStore';
import { useGameStore } from '@store/gameStore';
import * as authData from '@data/auth';
import { supabase } from '@data/supabase';
import type { AuthResult } from '@/types';

/** Auth operation result — no tokens exposed to UI */
type AuthOpResult = { ok: true } | { ok: false; error: { message: string } };

export function useAuth(): {
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<AuthOpResult>;
  signIn: (email: string, password: string) => Promise<AuthOpResult>;
  signOut: () => Promise<void>;
} {
  const setUser = useAuthStore((s) => s.setUser);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setError = useAuthStore((s) => s.setError);
  const resetAuth = useAuthStore((s) => s.reset);

  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
  const resetApp = useAppStore((s) => s.reset);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const endGame = useGameStore((s) => s.endGame);

  /**
   * Hydrate user from Supabase auth + profiles table.
   * Called on session restore and after sign-in/sign-up.
   */
  const hydrateUser = useCallback(
    async (userId: string): Promise<void> => {
      const result = await authData.fetchProfile(userId);
      if (result.ok) {
        setUser(result.data);
        setOnboardingCompleted(result.data.onboardingCompleted);
      }
    },
    [setUser, setOnboardingCompleted],
  );

  /**
   * Initialize auth on app launch.
   * Supabase restores session from secure store automatically.
   */
  const initialize = useCallback(async (): Promise<void> => {
    try {
      const result = await authData.getSession();
      if (result.ok && result.data) {
        await hydrateUser(result.data.user.id);
      }
    } catch {
      // Session restore failed — user will see login screen
    } finally {
      setInitialized(true);
    }
  }, [hydrateUser, setInitialized]);

  /** Subscribe to Supabase auth state changes (token refresh, sign-out, etc.) */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await hydrateUser(session.user.id);
      }
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
        resetAuth();
        resetApp();
        clearMessages();
        endGame();
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser, resetAuth, resetApp, clearMessages, endGame]);

  /** Sign up with email + password */
  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthOpResult> => {
      setLoading(true);
      setError(null);
      const result = await authData.signUp(email, password);
      if (!result.ok) {
        setError(result.error.message);
        setLoading(false);
        return { ok: false, error: { message: result.error.message } };
      }
      // hydrateUser will be called by onAuthStateChange listener
      setLoading(false);
      return { ok: true };
    },
    [setLoading, setError],
  );

  /** Sign in with email + password */
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthOpResult> => {
      setLoading(true);
      setError(null);
      const result = await authData.signIn(email, password);
      if (!result.ok) {
        setError(result.error.message);
        setLoading(false);
        return { ok: false, error: { message: result.error.message } };
      }
      setLoading(false);
      return { ok: true };
    },
    [setLoading, setError],
  );

  /** Sign out — wipe all stores + secure storage */
  const signOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    await authData.signOut();
    resetAuth();
    resetApp();
    clearMessages();
    endGame();
    setLoading(false);
  }, [setLoading, resetAuth, resetApp, clearMessages, endGame]);

  return { initialize, signUp, signIn, signOut };
}
