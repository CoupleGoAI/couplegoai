/**
 * Pure domain logic for AI chat messages.
 * No side effects, no framework dependencies.
 */

import type { ChatMessage, ValidationResult } from '@/types/index';

export const MAX_CHAT_MESSAGE_LENGTH = 2000;

/** Validate raw user input before sending */
export function validateMessageText(text: string): ValidationResult {
    const trimmed = text.trim();
    if (trimmed.length === 0) return { valid: false, error: 'Message cannot be empty' };
    if (trimmed.length > MAX_CHAT_MESSAGE_LENGTH) {
        return { valid: false, error: `Message too long (max ${MAX_CHAT_MESSAGE_LENGTH} characters)` };
    }
    return { valid: true, error: null };
}

/** Build a user ChatMessage from raw text */
export function createUserMessage(text: string): ChatMessage {
    return {
        id: generateId(),
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
    };
}

/** Build an assistant ChatMessage from an AI reply string */
export function createAssistantMessage(text: string): ChatMessage {
    return {
        id: generateId(),
        role: 'assistant',
        text,
        timestamp: Date.now(),
    };
}

function generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
