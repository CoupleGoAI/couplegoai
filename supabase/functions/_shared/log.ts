// Structured logger for edge functions.
//
// Hard rule: the only allowed fields are the ones this module accepts. It is
// intentionally impossible to log raw user message content, prompt payloads,
// AI responses, JWTs, or emails through this helper — offenders must go out
// of their way to use console.* directly, which is forbidden outside this
// file by the eslint policy (see eslint.config.js).

export type LogLevel = "info" | "warn" | "error";

// Allowlisted fields. Anything else is dropped.
export interface LogFields {
  feature: string;                // e.g. "ai-chat", "memory-summarize"
  event: string;                  // e.g. "request_received", "rate_limited"
  code?: string;                  // short machine-readable reason (e.g. "groq_429")
  correlationId?: string;         // request-scoped id for tracing
  userId?: string;                // auth.uid() — not PII on its own
  coupleId?: string;
  durationMs?: number;
  status?: number;                // HTTP or internal status
}

function sanitize(fields: LogFields): Record<string, unknown> {
  return {
    feature: fields.feature,
    event: fields.event,
    code: fields.code,
    correlationId: fields.correlationId,
    userId: fields.userId,
    coupleId: fields.coupleId,
    durationMs: fields.durationMs,
    status: fields.status,
    ts: new Date().toISOString(),
  };
}

export function logInfo(fields: LogFields): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: "info", ...sanitize(fields) }));
}

export function logWarn(fields: LogFields): void {
  // eslint-disable-next-line no-console
  console.warn(JSON.stringify({ level: "warn", ...sanitize(fields) }));
}

export function logError(fields: LogFields): void {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: "error", ...sanitize(fields) }));
}

// Small helper to produce a short, identifiable correlation id without
// pulling in a uuid dependency.
export function newCorrelationId(): string {
  const a = Math.random().toString(36).slice(2, 10);
  const b = Math.random().toString(36).slice(2, 10);
  return `${a}${b}`;
}
