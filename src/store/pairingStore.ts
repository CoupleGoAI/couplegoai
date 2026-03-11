import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PairingState {
  token: string | null;
  expiresAt: string | null;
  isPending: boolean;
  error: string | null;
}

interface PairingActions {
  setToken: (token: string | null) => void;
  setExpiresAt: (expiresAt: string | null) => void;
  setPending: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

type PairingStore = PairingState & PairingActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: PairingState = {
  token: null,
  expiresAt: null,
  isPending: false,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePairingStore = create<PairingStore>((set) => ({
  ...initialState,
  setToken: (token) => set({ token }),
  setExpiresAt: (expiresAt) => set({ expiresAt }),
  setPending: (v) => set({ isPending: v }),
  setError: (e) => set({ error: e }),
  reset: () => set(initialState),
}));
