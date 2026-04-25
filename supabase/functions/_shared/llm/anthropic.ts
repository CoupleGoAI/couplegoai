// Claude / Anthropic adapter. Notable differences from the OpenAI/Groq shape:
//
//   1. The `system` prompt is a top-level field, NOT a message role.
//   2. `messages` must alternate user/assistant and must start with a user
//      turn. We coalesce adjacent same-role turns defensively.
//   3. Responses come back as `content: [{ type: "text", text: "..." }]`.
//   4. Streaming is SSE but events are typed: `message_start`,
//      `content_block_start`, `content_block_delta`, `content_block_stop`,
//      `message_delta`, `message_stop`, `ping`. Only `content_block_delta`
//      with `delta.type === "text_delta"` contains user-facing text.
//   5. There is no native `response_format: json_object`. We emulate JSON
//      mode via a system-prompt contract and a tolerant extractor in
//      complete().

import {
  type LLMCompleteOptions,
  LLMError,
  type LLMMessage,
  type LLMProvider,
  type LLMStreamOptions,
} from "./types.ts";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

interface ClaudeBody {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

function splitSystem(messages: LLMMessage[]): ClaudeBody {
  // Claude expects a single `system` string. Concatenate all system messages
  // (there should only be one in practice) and strip them from the list.
  const systemParts: string[] = [];
  const rest: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      rest.push({ role: m.role, content: m.content });
    }
  }

  // Ensure conversation starts with a user turn. If the first turn is an
  // assistant (edge case), prepend a no-op user message so Claude accepts
  // the payload.
  if (rest.length === 0 || rest[0].role !== "user") {
    rest.unshift({ role: "user", content: "." });
  }

  // Coalesce adjacent same-role turns to satisfy Claude's strict alternation.
  const coalesced: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const turn of rest) {
    const last = coalesced[coalesced.length - 1];
    if (last && last.role === turn.role) {
      last.content = `${last.content}\n\n${turn.content}`;
    } else {
      coalesced.push({ ...turn });
    }
  }

  return { system: systemParts.join("\n\n"), messages: coalesced };
}

const JSON_REMINDER =
  "Respond with a single JSON object only. No prose, no code fences, no commentary before or after the JSON.";

function extractJson(raw: string): string {
  // Strip common wrappers: ```json ... ```, ``` ... ```, or leading prose.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }
  return raw.trim();
}

export class ClaudeProvider implements LLMProvider {
  readonly id = "claude" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new LLMError("unauthorized", "claude", "missing ANTHROPIC_API_KEY");
    }
    this.apiKey = apiKey;
  }

  async *stream(
    messages: LLMMessage[],
    opts: LLMStreamOptions,
  ): AsyncIterable<string> {
    const { system, messages: claudeMessages } = splitSystem(messages);

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        system,
        messages: claudeMessages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw toLLMError(response.status, "claude");
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
          if (data.length === 0) continue;

          try {
            const parsed = JSON.parse(data) as {
              type?: string;
              delta?: { type?: string; text?: string };
            };
            if (
              parsed.type === "content_block_delta" &&
              parsed.delta?.type === "text_delta" &&
              typeof parsed.delta.text === "string" &&
              parsed.delta.text.length > 0
            ) {
              yield parsed.delta.text;
            }
            if (parsed.type === "message_stop") return;
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
    const { system: baseSystem, messages: claudeMessages } = splitSystem(messages);
    const system = opts.jsonMode
      ? (baseSystem.length > 0 ? `${baseSystem}\n\n${JSON_REMINDER}` : JSON_REMINDER)
      : baseSystem;

    const doCall = async (): Promise<string> => {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: opts.model,
          system,
          messages: claudeMessages,
          max_tokens: opts.maxTokens,
          temperature: opts.temperature,
        }),
      });
      if (!response.ok) {
        throw toLLMError(response.status, "claude");
      }
      const body = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const parts = body.content ?? [];
      const text = parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");
      if (text.length === 0) {
        throw new LLMError("invalid_response", "claude", "empty completion");
      }
      return text;
    };

    const raw = await doCall();
    if (!opts.jsonMode) return raw;

    // JSON mode: try to parse; if parse fails, retry once with a stricter
    // reminder baked into the last user turn.
    const first = extractJson(raw);
    try {
      JSON.parse(first);
      return first;
    } catch {
      // retry path
      const retryMessages: LLMMessage[] = [
        ...messages,
        {
          role: "user",
          content:
            "Your previous reply was not valid JSON. Reply again with only a single JSON object.",
        },
      ];
      const { system: retrySystem, messages: retryClaudeMessages } =
        splitSystem(retryMessages);
      const retryResponse = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: opts.model,
          system: retrySystem,
          messages: retryClaudeMessages,
          max_tokens: opts.maxTokens,
          temperature: Math.min(opts.temperature, 0.1),
        }),
      });
      if (!retryResponse.ok) {
        throw toLLMError(retryResponse.status, "claude");
      }
      const body = (await retryResponse.json()) as {
        content?: Array<{ type?: string; text?: string }>;
      };
      const parts = body.content ?? [];
      const text = parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");
      const extracted = extractJson(text);
      try {
        JSON.parse(extracted);
        return extracted;
      } catch {
        throw new LLMError(
          "invalid_response",
          "claude",
          "json parse failed after retry",
        );
      }
    }
  }
}

function toLLMError(status: number, provider: string): LLMError {
  if (status === 401 || status === 403) {
    return new LLMError("unauthorized", provider, `claude_${status}`, status);
  }
  if (status === 429) {
    return new LLMError("rate_limited", provider, `claude_${status}`, status);
  }
  return new LLMError("unavailable", provider, `claude_${status}`, status);
}
