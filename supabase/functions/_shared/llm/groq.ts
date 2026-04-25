// Groq adapter. Groq exposes an OpenAI-compatible chat/completions endpoint,
// so streaming is standard SSE with `data: {...}\n\n` frames ending in
// `data: [DONE]`.

import {
  type LLMCompleteOptions,
  LLMError,
  type LLMMessage,
  type LLMProvider,
  type LLMStreamOptions,
} from "./types.ts";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements LLMProvider {
  readonly id = "groq" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LLMError("unauthorized", "groq", "missing GROQ_API_KEY");
    }
    this.apiKey = apiKey;
  }

  async *stream(
    messages: LLMMessage[],
    opts: LLMStreamOptions,
  ): AsyncIterable<string> {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        stream: true,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
      }),
    });

    if (!response.ok) {
      throw toLLMError(response.status, "groq");
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6).trim();
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (typeof content === "string" && content.length > 0) {
              yield content;
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async complete(
    messages: LLMMessage[],
    opts: LLMCompleteOptions,
  ): Promise<string> {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages,
        stream: false,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      throw toLLMError(response.status, "groq");
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new LLMError("invalid_response", "groq", "empty completion");
    }
    return content;
  }
}

function toLLMError(status: number, provider: string): LLMError {
  if (status === 401 || status === 403) {
    return new LLMError("unauthorized", provider, `groq_${status}`, status);
  }
  if (status === 429) {
    return new LLMError("rate_limited", provider, `groq_${status}`, status);
  }
  return new LLMError("unavailable", provider, `groq_${status}`, status);
}
