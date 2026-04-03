import { create } from 'zustand';
import type { InteractivePayload } from '@/types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoupleSetupMessage {
    id: string;
    /** 'user' = current user, 'partner' = other partner, 'assistant' = AI, 'interactive' = UI widget */
    role: 'user' | 'partner' | 'assistant' | 'interactive';
    content: string;
    createdAt: number;
    /** Display name shown above partner messages */
    senderName?: string | null;
    /** Present only when role === 'interactive' */
    interactive?: InteractivePayload;
}

interface CoupleSetupState {
    messages: CoupleSetupMessage[];
    isComplete: boolean;
    /** 0-based index: 0=dating_start_date, 1=help_focus */
    currentQuestion: number;
    isLoading: boolean;
    error: string | null;
}

interface CoupleSetupActions {
    addMessage: (msg: CoupleSetupMessage) => void;
    setIsComplete: (v: boolean) => void;
    setCurrentQuestion: (n: number) => void;
    setLoading: (v: boolean) => void;
    setError: (e: string | null) => void;
    reset: () => void;
}

type CoupleSetupStore = CoupleSetupState & CoupleSetupActions;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: CoupleSetupState = {
    messages: [],
    isComplete: false,
    currentQuestion: 0,
    isLoading: false,
    error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCoupleSetupStore = create<CoupleSetupStore>((set) => ({
    ...initialState,
    addMessage: (msg) =>
        set((state) => {
            if (state.messages.some((m) => m.id === msg.id)) {
                // #region agent log
                fetch('http://127.0.0.1:7822/ingest/856c1b22-f799-47d0-a7a4-5c2c4da5092a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'46fd3f'},body:JSON.stringify({sessionId:'46fd3f',runId:'pre-fix',hypothesisId:'H2',location:'src/store/coupleSetupStore.ts:addMessage',message:'Message skipped by id dedupe',data:{id:msg.id,role:msg.role,contentPreview:msg.content.slice(0,48)},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
                return state;
            }

            // Realtime and local paths can produce the same assistant text with
            // different ids (e.g. startup/resume races). Collapse near-identical
            // assistant duplicates that arrive within a short time window.
            if (msg.role === 'assistant') {
                const DUPLICATE_WINDOW_MS = 30_000;
                const hasNearDuplicateAssistant = state.messages.some(
                    (m) =>
                        m.role === 'assistant' &&
                        m.content === msg.content &&
                        Math.abs(m.createdAt - msg.createdAt) <= DUPLICATE_WINDOW_MS,
                );
                if (hasNearDuplicateAssistant) {
                    // #region agent log
                    fetch('http://127.0.0.1:7822/ingest/856c1b22-f799-47d0-a7a4-5c2c4da5092a',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'46fd3f'},body:JSON.stringify({sessionId:'46fd3f',runId:'pre-fix',hypothesisId:'H2',location:'src/store/coupleSetupStore.ts:addMessage',message:'Assistant skipped by content/time dedupe',data:{id:msg.id,contentPreview:msg.content.slice(0,48),createdAt:msg.createdAt},timestamp:Date.now()})}).catch(()=>{});
                    // #endregion
                    return state;
                }
            }

            const messages = [...state.messages, msg].sort((a, b) => {
                if (a.createdAt === b.createdAt) {
                    return a.id.localeCompare(b.id);
                }
                return a.createdAt - b.createdAt;
            });

            return { messages };
        }),
    setIsComplete: (v) => set({ isComplete: v }),
    setCurrentQuestion: (n) => set({ currentQuestion: n }),
    setLoading: (v) => set({ isLoading: v }),
    setError: (e) => set({ error: e }),
    reset: () => set(initialState),
}));
