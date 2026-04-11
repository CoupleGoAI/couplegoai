import { THERAPY_SYSTEM_PROMPT } from '@domain/wellbeing/therapySystemPrompt';

/**
 * Local LLM via Ollama HTTP API (`ollama serve`, default port 11434).
 * Hugging Face: run an OpenAI-compatible server (e.g. vLLM / TGI) and point
 * EXPO_PUBLIC_OLLAMA_BASE_URL at its base URL if it exposes `/v1/chat/completions`;
 * this module uses Ollama's native `/api/chat` shape only.
 *
 * Default model: `llama3.2:latest` (must match a name from `ollama list`; pull with
 * `ollama pull llama3.2`). Untagged `llama3.2` is often rejected by the API.
 * Override with EXPO_PUBLIC_OLLAMA_THERAPY_MODEL (e.g. `llama3.1:8b`, `llama3.2:3b`).
 */

const DEFAULT_BASE = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'qwen3.5:latest';
const REQUEST_TIMEOUT_MS = 120_000;

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaChatResponseBody {
    message?: { role?: string; content?: string };
    error?: string;
}

function getBaseUrl(): string {
    const fromEnv = process.env.EXPO_PUBLIC_OLLAMA_BASE_URL?.trim();
    return fromEnv && fromEnv.length > 0 ? fromEnv.replace(/\/$/, '') : DEFAULT_BASE;
}

export function getConfiguredOllamaTherapyModel(): string {
    const m = process.env.EXPO_PUBLIC_OLLAMA_THERAPY_MODEL?.trim();
    return m && m.length > 0 ? m : DEFAULT_MODEL;
}

export function getLocalTherapyOllamaBaseUrl(): string {
    return getBaseUrl();
}

export type LocalTherapyResult =
    | { ok: true; reply: string }
    | { ok: false; error: string };

/**
 * Sends conversation turns to Ollama and returns the assistant reply (non-streaming).
 */
export async function completeTherapyChat(
    conversation: OllamaChatMessage[],
): Promise<LocalTherapyResult> {
    const base = getBaseUrl();
    const model = getConfiguredOllamaTherapyModel();

    const messages: OllamaChatMessage[] = [
        { role: 'system', content: THERAPY_SYSTEM_PROMPT },
        ...conversation.filter((m) => m.role !== 'system'),
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const res = await fetch(`${base}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });

        const raw = (await res.json()) as OllamaChatResponseBody;

        if (!res.ok) {
            const baseMsg =
                typeof raw.error === 'string' && raw.error.length > 0
                    ? raw.error
                    : `Ollama returned ${String(res.status)}`;
            const lower = baseMsg.toLowerCase();
            const looksLikeMissingModel =
                lower.includes('not found') ||
                lower.includes('unknown model') ||
                lower.includes('model not found');
            const modelHint = looksLikeMissingModel
                ? ` Install one with the same name as in \`ollama list\`, e.g. \`ollama pull llama3.2\`, or set EXPO_PUBLIC_OLLAMA_THERAPY_MODEL to your model (restart Expo after changing .env).`
                : '';
            return { ok: false, error: baseMsg + modelHint };
        }

        const content = raw.message?.content;
        if (typeof content !== 'string' || content.trim().length === 0) {
            return { ok: false, error: 'Empty response from model. Is the model pulled?' };
        }

        return { ok: true, reply: content.trim() };
    } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            return { ok: false, error: 'Request timed out. Try a smaller model or shorter message.' };
        }
        return {
            ok: false,
            error:
                'Could not reach Ollama. Start it with `ollama serve`, confirm the URL (Android emulator: http://10.0.2.2:11434), and pull the model.',
        };
    } finally {
        clearTimeout(timeoutId);
    }
}
