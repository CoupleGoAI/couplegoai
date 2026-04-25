// Provider selection. Reads one env var (`AI_PROVIDER`) and one matching
// API-key env var. Everything else is hidden behind the LLMProvider
// interface — no call-site ever sees `GROQ_API_KEY` vs `ANTHROPIC_API_KEY`.

import { GroqProvider } from "./groq.ts";
import { ClaudeProvider } from "./anthropic.ts";
import { LLMError, type LLMProvider } from "./types.ts";

export type ProviderId = "groq" | "claude";

// Default model per provider per call profile. Keeping model choice inside
// the factory means swapping model versions is a one-line change and never
// leaks into business logic.
export interface ProviderModels {
  chat: string;
  memory: string;
}

const DEFAULTS: Record<ProviderId, ProviderModels> = {
  groq: {
    chat: "llama-3.3-70b-versatile",
    memory: "llama-3.3-70b-versatile",
  },
  claude: {
    // Sensible production defaults; override via CLAUDE_CHAT_MODEL /
    // CLAUDE_MEMORY_MODEL if the team wants different tiers.
    chat: "claude-sonnet-4-5",
    memory: "claude-haiku-4-5",
  },
};

export interface ResolvedProvider {
  provider: LLMProvider;
  models: ProviderModels;
}

function readEnv(name: string): string {
  return (Deno.env.get(name) ?? "").trim();
}

function resolveProviderId(): ProviderId {
  const raw = readEnv("AI_PROVIDER").toLowerCase();
  if (raw === "claude" || raw === "anthropic") return "claude";
  // default — Groq — matches current production behaviour.
  return "groq";
}

export function getProvider(): ResolvedProvider {
  const id = resolveProviderId();

  if (id === "claude") {
    const key = readEnv("ANTHROPIC_API_KEY");
    const provider = new ClaudeProvider(key);
    return {
      provider,
      models: {
        chat: readEnv("CLAUDE_CHAT_MODEL") || DEFAULTS.claude.chat,
        memory: readEnv("CLAUDE_MEMORY_MODEL") || DEFAULTS.claude.memory,
      },
    };
  }

  const key = readEnv("GROQ_API_KEY");
  const provider = new GroqProvider(key);
  return {
    provider,
    models: {
      chat: readEnv("GROQ_CHAT_MODEL") || DEFAULTS.groq.chat,
      memory: readEnv("GROQ_MEMORY_MODEL") || DEFAULTS.groq.memory,
    },
  };
}

// Safe variant for code paths that want to return 503 on misconfiguration
// instead of throwing.
export function tryGetProvider(): ResolvedProvider | null {
  try {
    return getProvider();
  } catch (err) {
    if (err instanceof LLMError && err.kind === "unauthorized") return null;
    throw err;
  }
}
