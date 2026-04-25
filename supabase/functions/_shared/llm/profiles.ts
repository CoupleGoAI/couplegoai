// Named call profiles. Values were chosen to match the behaviour of the
// original Groq-only integration. Model is provider-specific and resolved
// in factory.ts; temperature / maxTokens are stable across providers.

import type { LLMStreamOptions, LLMCompleteOptions } from "./types.ts";

export interface ProfileDefaults {
  temperature: number;
  maxTokens: number;
}

// Streaming chat reply to the user. Token cap bumped 200 → 400 to avoid
// mid-sentence truncation that appears in current production replies.
export const chatProfile: ProfileDefaults = {
  temperature: 0.75,
  maxTokens: 400,
};

// Deterministic JSON memory distillation.
export const memoryProfile: ProfileDefaults = {
  temperature: 0.2,
  maxTokens: 800,
};

// Same shape as memoryProfile but kept separate so couple-memory quirks can
// diverge without touching solo memory.
export const coupleMemoryProfile: ProfileDefaults = {
  temperature: 0.2,
  maxTokens: 800,
};

// Helper that merges a named profile with a provider-resolved model name.
export function withModel(
  defaults: ProfileDefaults,
  model: string,
): LLMStreamOptions {
  return { model, temperature: defaults.temperature, maxTokens: defaults.maxTokens };
}

export function withJsonModel(
  defaults: ProfileDefaults,
  model: string,
): LLMCompleteOptions {
  return {
    model,
    temperature: defaults.temperature,
    maxTokens: defaults.maxTokens,
    jsonMode: true,
  };
}
