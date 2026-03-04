import { create } from 'zustand';
import type { User, Partner, Couple } from '@/types';

interface AppStore {
  onboardingCompleted: boolean;
  currentUser: User | null;
  partner: Partner | null;
  couple: Couple | null;
  colorScheme: 'light' | 'dark';

  // Actions
  setOnboardingCompleted: (value: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setPartner: (partner: Partner | null) => void;
  setCouple: (couple: Couple | null) => void;
  setColorScheme: (scheme: 'light' | 'dark') => void;
  reset: () => void;
}

const initialState = {
  onboardingCompleted: false,
  currentUser: null,
  partner: null,
  couple: null,
  colorScheme: 'light' as const,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setOnboardingCompleted: (value) => set({ onboardingCompleted: value }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setPartner: (partner) => set({ partner }),
  setCouple: (couple) => set({ couple }),
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  reset: () => set(initialState),
}));
