import { useCallback } from 'react';
import { usePairingStore } from '@store/pairingStore';
import { useAuthStore } from '@store/authStore';
import * as pairingApi from '@data/pairingApi';
import { validateQRPayload } from '@domain/pairing/validation';

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UsePairingReturn {
  token: string | null;
  expiresAt: string | null;
  isPending: boolean;
  error: string | null;
  clearEntryScreen: () => void;
  generateToken: () => Promise<void>;
  connect: (rawQR: string) => Promise<{ partnerName: string | null; coupleId: string } | null>;
  disconnect: () => Promise<void>;
  /**
   * Subscribe to Supabase Realtime events for when the current user's partner
   * scans their QR code (i.e. when `couple_id` is set on the user's profile).
   * Returns a cleanup function to unsubscribe.
   */
  subscribeToPartnerConnected: (
    onConnected: (partnerName: string | null, coupleId: string) => void,
  ) => () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePairing(): UsePairingReturn {
  const token = usePairingStore((s) => s.token);
  const expiresAt = usePairingStore((s) => s.expiresAt);
  const isPending = usePairingStore((s) => s.isPending);
  const error = usePairingStore((s) => s.error);
  const setEntryScreen = usePairingStore((s) => s.setEntryScreen);
  const setToken = usePairingStore((s) => s.setToken);
  const setExpiresAt = usePairingStore((s) => s.setExpiresAt);
  const setPending = usePairingStore((s) => s.setPending);
  const setError = usePairingStore((s) => s.setError);
  const resetPairing = usePairingStore((s) => s.reset);

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  /** Generate a new pairing token and store it. */
  const generateToken = useCallback(async (): Promise<void> => {
    setPending(true);
    setError(null);

    const result = await pairingApi.generateToken();

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }

    setToken(result.data.token);
    setExpiresAt(result.data.expiresAt);
    setPending(false);
  }, [setPending, setError, setToken, setExpiresAt]);

  /**
   * Validate a scanned QR payload client-side, then connect via edge function.
   * Returns partner info on success, null on failure (error set in store).
   */
  const connect = useCallback(
    async (rawQR: string): Promise<{ partnerName: string | null; coupleId: string } | null> => {
      setError(null);

      // Client-side format check (server is authoritative for security checks)
      const validation = validateQRPayload(rawQR);
      if (!validation.valid || !validation.token) {
        setError(validation.error);
        return null;
      }

      setPending(true);
      const result = await pairingApi.connectWithToken(validation.token);
      setPending(false);

      if (!result.ok) {
        setError(result.error);
        return null;
      }

      resetPairing();

      return {
        partnerName: result.data.partner.name,
        coupleId: result.data.couple.id,
      };
    },
    [resetPairing, setPending, setError],
  );

  /** Disconnect from the current partner and reset local state. */
  const disconnect = useCallback(async (): Promise<void> => {
    setPending(true);
    setError(null);

    const result = await pairingApi.disconnect();
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Update authStore: clear coupleId
    if (user) {
      setUser({ ...user, coupleId: null });
    }

    resetPairing();
  }, [setPending, setError, user, setUser, resetPairing]);

  const clearEntryScreen = useCallback((): void => {
    setEntryScreen(null);
  }, [setEntryScreen]);

  /**
   * Subscribe to realtime events on the current user's profile.
   * When the partner scans the QR code, pairing-connect sets couple_id on
   * this profile — the subscription fires and we fetch partner info to hand
   * off to the caller (typically for navigation to ConnectionConfirmed).
   */
  const subscribeToPartnerConnected = useCallback(
    (onConnected: (partnerName: string | null, coupleId: string) => void): (() => void) => {
      if (!user?.id) return () => undefined;

      return pairingApi.subscribeToPartnerConnected(user.id, (coupleId) => {
        void (async () => {
          const statusResult = await pairingApi.fetchCoupleStatus();
          const partnerName =
            statusResult.ok && statusResult.data.partner
              ? statusResult.data.partner.name
              : null;
          onConnected(partnerName, coupleId);
        })();
      });
    },
    [user?.id],
  );

  return { token, expiresAt, isPending, error, clearEntryScreen, generateToken, connect, disconnect, subscribeToPartnerConnected };
}
