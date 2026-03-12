/**
 * Client-side QR payload validation (format check only).
 * Actual security validation is enforced server-side.
 *
 * MUST-7: QR payload contains only the token string — no PII.
 */

/** Maximum token length accepted by the server */
export const MAX_TOKEN_LENGTH = 100;

/** Regex: printable ASCII only (0x20–0x7E) */
const PRINTABLE_ASCII_RE = /^[\x20-\x7E]+$/;

export interface QRValidationResult {
  valid: boolean;
  token: string | null;
  error: string | null;
}

/**
 * Validates the raw string scanned from a QR code.
 * Checks: non-empty, within length limit, printable ASCII characters only.
 * Does NOT validate the token against the server — that is done by pairing-connect.
 */
export function validateQRPayload(raw: string | null | undefined): QRValidationResult {
  if (!raw || raw.trim().length === 0) {
    return {
      valid: false,
      token: null,
      error: "That doesn't look like a valid CoupleGoAI code.",
    };
  }

  const trimmed = raw.trim();

  if (trimmed.length > MAX_TOKEN_LENGTH) {
    return {
      valid: false,
      token: null,
      error: "That doesn't look like a valid CoupleGoAI code.",
    };
  }

  if (!PRINTABLE_ASCII_RE.test(trimmed)) {
    return {
      valid: false,
      token: null,
      error: "That doesn't look like a valid CoupleGoAI code.",
    };
  }

  return { valid: true, token: trimmed, error: null };
}
