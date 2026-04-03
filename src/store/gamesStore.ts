import { create } from 'zustand';
import type {
  GameType,
  GameCategoryKey,
  GameInvitation,
  GameSessionSnapshot,
  GameAnswerPayload,
} from '@/types/games';

type NavigationIntent =
  | { type: 'lobby'; invitationId: string }
  | { type: 'session'; sessionId: string }
  | { type: 'results'; sessionId: string }
  | null;

interface GamesState {
  /** Pending invite the current user received */
  pendingInvite: GameInvitation | null;
  /** Pending invite the current user sent */
  outgoingInvite: GameInvitation | null;
  /** Active session ID for resume */
  activeSessionId: string | null;
  /** Full session snapshot from server */
  latestSnapshot: GameSessionSnapshot | null;
  /** Locally locked answer before server confirms */
  pendingAnswer: GameAnswerPayload | null;
  /** Navigation intent from realtime events */
  navigationIntent: NavigationIntent;
  /** Error message for UI display */
  error: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Selected game type on hub */
  selectedGameType: GameType | null;
  /** Selected category on hub */
  selectedCategory: GameCategoryKey;
}

interface GamesActions {
  setPendingInvite: (invite: GameInvitation | null) => void;
  setOutgoingInvite: (invite: GameInvitation | null) => void;
  setActiveSessionId: (sessionId: string | null) => void;
  setLatestSnapshot: (snapshot: GameSessionSnapshot | null) => void;
  setPendingAnswer: (answer: GameAnswerPayload | null) => void;
  setNavigationIntent: (intent: NavigationIntent) => void;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedGameType: (type: GameType | null) => void;
  setSelectedCategory: (category: GameCategoryKey) => void;
  reset: () => void;
}

const initialState: GamesState = {
  pendingInvite: null,
  outgoingInvite: null,
  activeSessionId: null,
  latestSnapshot: null,
  pendingAnswer: null,
  navigationIntent: null,
  error: null,
  isLoading: false,
  selectedGameType: null,
  selectedCategory: 'mixed',
};

export const useGamesStore = create<GamesState & GamesActions>((set) => ({
  ...initialState,
  setPendingInvite: (invite) => set({ pendingInvite: invite }),
  setOutgoingInvite: (invite) => set({ outgoingInvite: invite }),
  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
  setLatestSnapshot: (snapshot) => set({ latestSnapshot: snapshot }),
  setPendingAnswer: (answer) => set({ pendingAnswer: answer }),
  setNavigationIntent: (intent) => set({ navigationIntent: intent }),
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedGameType: (type) => set({ selectedGameType: type }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  reset: () => set(initialState),
}));
