import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types/index';
import { validateMessageText, createUserMessage, createAssistantMessage } from '@/domain/aiChat/validation';
import { sendMessage as apiSendMessage } from '@data/aiChatApi';

export interface UseAiChatReturn {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    send: (text: string) => Promise<void>;
    clearError: () => void;
}

export function useAiChat(): UseAiChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const send = useCallback(async (text: string): Promise<void> => {
        const validation = validateMessageText(text);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        const userMsg = createUserMessage(text);
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);
        setError(null);

        const result = await apiSendMessage(text);

        if (result.ok) {
            const assistantMsg = createAssistantMessage(result.reply);
            setMessages((prev) => [...prev, assistantMsg]);
        } else {
            setError(result.error);
        }

        setIsLoading(false);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return { messages, isLoading, error, send, clearError };
}
