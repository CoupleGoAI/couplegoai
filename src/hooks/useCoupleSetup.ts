import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCoupleSetupStore } from '@store/coupleSetupStore';
import { useAuthStore } from '@store/authStore';
import { sendCoupleSetupMessage } from '@data/coupleSetupApi';
import * as authData from '@data/auth';
import {
    fetchPartnerInfo,
    subscribeToPartnerCoupleSetupMessages,
    subscribeToCoupleCompletion,
    subscribeToCoupleDatingStart,
} from '@data/coupleChatApi';
import { supabase } from '@data/supabase';
import { sanitizeMessage } from '@domain/onboarding/validation';
import type { CoupleSetupMessage } from '@store/coupleSetupStore';
import type { InteractivePayload } from '@/types/index';
import type { PartnerInfo } from '@data/coupleChatApi';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TOTAL_COUPLE_SETUP_QUESTIONS = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCoupleSetupReturn {
    messages: CoupleSetupMessage[];
    isComplete: boolean;
    currentQuestion: number;
    totalQuestions: number;
    isLoading: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    isInitializing: boolean;
    retryComplete: () => Promise<void>;
    hasActivePicker: boolean;
    confirmDatePicker: (isoDate: string) => void;
    partnerInfo: PartnerInfo | null;
}

// ─── ID Helper ────────────────────────────────────────────────────────────────

function generateMessageId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeDateOnlyInput(input: string): string | null {
    const trimmed = input.trim();
    const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

    if (DATE_ONLY_RE.test(trimmed)) {
        return trimmed;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed.toISOString().slice(0, 10);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCoupleSetup(): UseCoupleSetupReturn {
    const [isInitializing, setIsInitializing] = useState(true);
    const [activePicker, setActivePicker] = useState<InteractivePayload | null>(null);
    const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);

    const messages = useCoupleSetupStore((s) => s.messages);
    const isComplete = useCoupleSetupStore((s) => s.isComplete);
    const currentQuestion = useCoupleSetupStore((s) => s.currentQuestion);
    const isLoading = useCoupleSetupStore((s) => s.isLoading);
    const error = useCoupleSetupStore((s) => s.error);
    const addMessage = useCoupleSetupStore((s) => s.addMessage);
    const setIsComplete = useCoupleSetupStore((s) => s.setIsComplete);
    const setCurrentQuestion = useCoupleSetupStore((s) => s.setCurrentQuestion);
    const setLoading = useCoupleSetupStore((s) => s.setLoading);
    const setError = useCoupleSetupStore((s) => s.setError);
    const reset = useCoupleSetupStore((s) => s.reset);

    const setUser = useAuthStore((s) => s.setUser);
    const userId = useAuthStore((s) => s.user?.id);
    const coupleId = useAuthStore((s) => s.user?.coupleId);
    const authCoupleSetupCompleted = useAuthStore((s) => s.user?.coupleSetupCompleted ?? false);

    const hasInitialized = useRef(false);
    const isSendingRef = useRef(false);

    const syncStepFromCoupleRow = useCallback(async (): Promise<void> => {
        if (!coupleId) return;
        const { data, error: coupleError } = await supabase
            .from('couples')
            .select('dating_start_date, help_focus')
            .eq('id', coupleId)
            .maybeSingle();

        if (coupleError || !data) return;

        const typed = data as { dating_start_date: string | null; help_focus: string | null };
        if (typed.help_focus) {
            setCurrentQuestion(2);
            setIsComplete(true);
            setActivePicker(null);
            return;
        }
        if (typed.dating_start_date) {
            setCurrentQuestion(Math.max(currentQuestion, 1));
            setActivePicker(null);
        }
    }, [coupleId, currentQuestion, activePicker, setCurrentQuestion, setIsComplete]);

    // Fetch partner info once coupled
    useEffect(() => {
        if (!coupleId || !userId) return;
        let cancelled = false;
        void fetchPartnerInfo(coupleId, userId).then((result) => {
            if (cancelled) return;
            if (result.ok) setPartnerInfo(result.data);
        });
        return () => { cancelled = true; };
    }, [coupleId, userId]);

    // Subscribe to partner's couple_setup messages in realtime
    useEffect(() => {
        if (!partnerInfo) return;
        const channel = subscribeToPartnerCoupleSetupMessages(
            partnerInfo.id,
            partnerInfo.name,
            (msg) => {
                const incoming: CoupleSetupMessage = {
                    id: msg.id,
                    role: msg.role === 'assistant' ? 'assistant' : 'partner',
                    content: msg.content,
                    createdAt: msg.createdAt,
                    senderName: msg.senderName,
                };
                addMessage(incoming);
                void syncStepFromCoupleRow();
            },
        );
        return () => { void supabase.removeChannel(channel); };
    }, [partnerInfo, addMessage, syncStepFromCoupleRow]);

    // Subscribe to couple row — auto-complete when partner finishes setup
    useEffect(() => {
        if (!coupleId || !userId) return;
        const channel = subscribeToCoupleCompletion(coupleId, () => {
            void authData.fetchProfile(userId).then((result) => {
                if (result.ok) setUser(result.data);
            });
        });
        return () => { void supabase.removeChannel(channel); };
    }, [coupleId, userId, setUser]);

    // Clear the date picker when dating_start_date is set on the couple row
    // (handles the case where the other partner submitted the date first).
    // Send a resumption message so the edge function returns the help-focus prompt.
    useEffect(() => {
        if (!coupleId) return;
        const channel = subscribeToCoupleDatingStart(coupleId, (state) => {
            setActivePicker(null);
            if (state.helpFocus) {
                setCurrentQuestion(2);
                setIsComplete(true);
            } else {
                setCurrentQuestion(1);
            }
        });
        return () => { void supabase.removeChannel(channel); };
    }, [coupleId, currentQuestion, activePicker, setCurrentQuestion, setIsComplete]);

    // Derive display messages — append synthetic interactive message when a picker is active
    const displayMessages = useMemo((): CoupleSetupMessage[] => {
        if (!activePicker) return messages;
        return [
            ...messages,
            {
                id: 'interactive-picker',
                role: 'interactive',
                content: '',
                createdAt: Date.now(),
                interactive: activePicker,
            },
        ];
    }, [messages, activePicker]);

    const sendMessage = useCallback(
        async (text: string): Promise<void> => {
            const sanitized = sanitizeMessage(text);

            if (isSendingRef.current && sanitized.length === 0) {
                return;
            }

            isSendingRef.current = true;
            setLoading(true);
            setError(null);
            try {
                if (sanitized.length > 0) {
                    const userMsg: CoupleSetupMessage = {
                        id: generateMessageId('user'),
                        role: 'user',
                        content: sanitized,
                        createdAt: Date.now(),
                    };
                    addMessage(userMsg);
                }

                const result = await sendCoupleSetupMessage(sanitized);

                if (!result.ok) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }

                const { reply, questionIndex, isComplete: complete } = result.data;

                if (typeof reply !== 'string' || typeof questionIndex !== 'number' || typeof complete !== 'boolean') {
                    setError('Unexpected response from server. Please try again.');
                    setLoading(false);
                    return;
                }

                const aiMsg: CoupleSetupMessage = {
                    id: generateMessageId('ai'),
                    role: 'assistant',
                    content: reply,
                    createdAt: Date.now(),
                };
                addMessage(aiMsg);
                const nextQuestion = Math.max(currentQuestion, questionIndex);
                setCurrentQuestion(nextQuestion);
                setIsComplete(complete);
                setLoading(false);

                // Only show picker while still on step 0. Guard against stale/out-of-order
                // responses that could otherwise reopen the picker after couple step advanced.
                if (nextQuestion === 0 && !complete) {
                    const today = new Date().toISOString().split('T')[0];
                    setActivePicker({
                        type: 'date-picker',
                        maxDate: today,
                        title: 'Please choose the date when you started dating.',
                    });
                } else {
                    setActivePicker(null);
                }

                // Refresh auth profile so RootNavigator transitions reactively
                if (complete && userId) {
                    const profileResult = await authData.fetchProfile(userId);
                    if (profileResult.ok) {
                        setUser(profileResult.data);
                    }
                }
            } finally {
                isSendingRef.current = false;
            }
        },
        [addMessage, currentQuestion, activePicker, setLoading, setError, setCurrentQuestion, setIsComplete, setUser, userId],
    );

    /** Called when the date picker emits a confirmed ISO date. */
    const confirmDatePicker = useCallback(
        (isoDate: string) => {
            const normalizedDate = normalizeDateOnlyInput(isoDate);
            if (!normalizedDate) {
                setError('Invalid date selected. Please choose a date from the picker.');
                return;
            }
            setActivePicker(null);
            void sendMessage(normalizedDate);
        },
        [sendMessage, setError],
    );

    const retryComplete = useCallback(async (): Promise<void> => {
        if (!userId) {
            setError('Session error. Please sign out and back in.');
            return;
        }
        setLoading(true);
        setError(null);

        // Small delay to ensure DB transaction from couple-setup edge function has committed
        await new Promise((resolve) => setTimeout(resolve, 500));

        const profileResult = await authData.fetchProfile(userId);
        if (profileResult.ok) {
            setUser(profileResult.data);
            // If profile still doesn't show completion, the DB might be slow — navigation
            // will happen once auth store's coupleSetupCompleted becomes true.
        } else {
            setError('Could not connect. Please try again.');
        }
        setLoading(false);
    }, [userId, setUser, setLoading, setError]);

    // Initialize once: reset store so we always start fresh
    // If user is already coupled with setup complete, mark as complete immediately
    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;
        reset();
        // If auth store already shows couple setup as complete, skip the flow
        if (authCoupleSetupCompleted) {
            setIsComplete(true);
        }
        setIsInitializing(false);
    }, [authCoupleSetupCompleted, reset, setIsComplete]);

    return {
        messages: displayMessages,
        isComplete,
        currentQuestion,
        totalQuestions: TOTAL_COUPLE_SETUP_QUESTIONS,
        isLoading,
        error,
        sendMessage,
        isInitializing,
        retryComplete,
        hasActivePicker: activePicker !== null,
        confirmDatePicker,
        partnerInfo,
    };
}
