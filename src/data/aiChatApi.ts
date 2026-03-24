/**
 * AI chat data layer.
 *
 * The sendMessage function is the ONLY integration point for LLM providers.
 * Swap this implementation to connect any provider (Claude, OpenAI, etc.).
 * The contract is: text in → Promise<ChatResult> out.
 */

import type { ChatResult } from '@/types/index';

const STUB_DELAY_MS = 900;

const PLACEHOLDER_RESPONSES: readonly string[] = [
    "I'm here for you. Tell me more about what's on your mind.",
    "That sounds meaningful. How does it make you feel?",
    "I hear you. Would you like to explore that a little more?",
    "Thank you for sharing that with me. What would feel most supportive right now?",
    "It takes courage to open up. I'm listening.",
];

/**
 * Send a message to the AI and receive a reply.
 *
 * STUB: returns a random placeholder after a simulated delay.
 * Replace this function body with a real LLM call — the signature stays the same.
 */
export async function sendMessage(_text: string): Promise<ChatResult> {
    await new Promise<void>((resolve) => setTimeout(resolve, STUB_DELAY_MS));
    const idx = Math.floor(Math.random() * PLACEHOLDER_RESPONSES.length);
    const reply = PLACEHOLDER_RESPONSES[idx] ?? "I'm here for you.";
    return { ok: true, reply };
}
