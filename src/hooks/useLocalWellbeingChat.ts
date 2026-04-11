import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types/index';
import { validateMessageText, createUserMessage, createAssistantMessage } from '@domain/aiChat/validation';
import {
    completeTherapyChat,
    type OllamaChatMessage,
} from '@data/localOllamaTherapyApi';

export interface UseLocalWellbeingChatReturn {
    messages: ChatMessage[];
    isSending: boolean;
    error: string | null;
    send: (text: string) => Promise<void>;
    clearError: () => void;
}

function toOllamaMessages(history: ChatMessage[]): OllamaChatMessage[] {
    return history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
    }));
}

export function useLocalWellbeingChat(): UseLocalWellbeingChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const send = useCallback(async (text: string): Promise<void> => {
        const validation = validateMessageText(text);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        const userMsg = createUserMessage(text);
        let historyForApi: ChatMessage[] = [];
        setMessages((prev) => {
            historyForApi = [...prev, userMsg];
            return historyForApi;
        });
        setError(null);
        setIsSending(true);

        const result = await completeTherapyChat(toOllamaMessages(historyForApi));

        setIsSending(false);

        if (!result.ok) {
            setError(result.error);
            return;
        }

        setMessages((prev) => [...prev, createAssistantMessage(result.reply)]);
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return { messages, isSending, error, send, clearError };
}
