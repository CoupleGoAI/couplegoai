// Deterministic redaction applied to any text that will be sent to an LLM
// or persisted into a derived memory row. Extracted from the original
// coupleMemory.ts pipeline so the same patterns apply to solo memory and to
// any future summariser.

const MAX_TURN_CHARS = 800;

const REDACT_PATTERNS: Array<{ re: RegExp; replacement: string }> = [
  // emails
  { re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, replacement: "[redacted]" },
  // urls
  { re: /https?:\/\/\S+/gi, replacement: "[redacted]" },
  // IPv4
  { re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "[redacted]" },
  // long hex / api-key-like tokens
  { re: /\b(?:sk|pk|rk)_[A-Za-z0-9_-]{8,}\b/g, replacement: "[redacted]" },
  { re: /\b[A-Fa-f0-9]{20,}\b/g, replacement: "[redacted]" },
  // IBAN-ish (country code + 13+ alphanumerics)
  { re: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, replacement: "[redacted]" },
  // phone (loose: 7+ digits with optional separators / leading +)
  { re: /\+?\d[\d\s().-]{7,}\d/g, replacement: "[redacted]" },
  // long bare digit runs (account numbers, card-like)
  { re: /\b\d{9,}\b/g, replacement: "[redacted]" },
];

export interface RedactResult {
  text: string;
  droppedAnything: boolean;
}

export function redact(
  text: string,
  knownNames: ReadonlyArray<string> = [],
): RedactResult {
  let out = text.length > MAX_TURN_CHARS ? text.slice(0, MAX_TURN_CHARS) : text;
  let dropped = out.length !== text.length;

  for (const { re, replacement } of REDACT_PATTERNS) {
    if (re.test(out)) {
      dropped = true;
      out = out.replace(re, replacement);
    }
  }

  // Mask third-party proper nouns: any Capitalized word that isn't
  // sentence-start and isn't a known allowed name. Crude on purpose.
  const allowed = new Set(
    knownNames
      .filter((n): n is string => typeof n === "string" && n.length > 0)
      .map((n) => n.toLowerCase()),
  );
  out = out.replace(/(?<=\S\s)([A-Z][a-z]{2,})/g, (match) => {
    if (allowed.has(match.toLowerCase())) return match;
    dropped = true;
    return "someone";
  });

  return { text: out, droppedAnything: dropped };
}
