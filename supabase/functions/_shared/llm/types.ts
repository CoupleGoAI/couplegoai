// Provider-agnostic LLM interface. Every adapter (Groq, Claude, future
// Gemini/local/etc.) must satisfy `LLMProvider`. No provider-specific types
// leak past this module.

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStreamOptions {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMCompleteOptions extends LLMStreamOptions {
  // When true, the provider must return a single JSON object as the reply.
  // Providers without a native JSON mode emulate it via prompt instruction +
  // a tolerant extract-and-parse fallback.
  jsonMode?: boolean;
}

export type LLMErrorKind =
  | "rate_limited"       // 429-ish; upstream throttled
  | "unavailable"        // 5xx, timeouts, network
  | "invalid_response"   // non-JSON in json mode, missing content, etc.
  | "unauthorized";      // bad or missing API key

export class LLMError extends Error {
  readonly kind: LLMErrorKind;
  readonly provider: string;
  readonly upstreamStatus?: number;

  constructor(
    kind: LLMErrorKind,
    provider: string,
    message: string,
    upstreamStatus?: number,
  ) {
    super(message);
    this.kind = kind;
    this.provider = provider;
    this.upstreamStatus = upstreamStatus;
  }
}

export interface LLMProvider {
  readonly id: "groq" | "claude";

  // Streaming completion: yields plain text chunks as they arrive. Callers
  // must never peek at provider-specific event metadata.
  stream(
    messages: LLMMessage[],
    opts: LLMStreamOptions,
  ): AsyncIterable<string>;

  // Non-streaming completion. When `jsonMode` is true the returned string
  // is a parseable JSON object (caller still validates schema).
  complete(
    messages: LLMMessage[],
    opts: LLMCompleteOptions,
  ): Promise<string>;
}
