import { validateQRPayload, MAX_TOKEN_LENGTH } from '../validation';

describe('validateQRPayload', () => {
  it('returns valid for a well-formed UUID token', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = validateQRPayload(uuid);
    expect(result.valid).toBe(true);
    expect(result.token).toBe(uuid);
    expect(result.error).toBeNull();
  });

  it('returns invalid for null input', () => {
    const result = validateQRPayload(null);
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for undefined input', () => {
    const result = validateQRPayload(undefined);
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for empty string', () => {
    const result = validateQRPayload('');
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid for whitespace-only string', () => {
    const result = validateQRPayload('   ');
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns invalid when token exceeds MAX_TOKEN_LENGTH', () => {
    const long = 'a'.repeat(MAX_TOKEN_LENGTH + 1);
    const result = validateQRPayload(long);
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it('returns valid for token of exactly MAX_TOKEN_LENGTH characters', () => {
    const exact = 'a'.repeat(MAX_TOKEN_LENGTH);
    const result = validateQRPayload(exact);
    expect(result.valid).toBe(true);
    expect(result.token).toBe(exact);
  });

  it('returns invalid for non-printable ASCII characters', () => {
    const result = validateQRPayload('token\x00with\x01control');
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
  });

  it('returns invalid for non-ASCII characters (emoji)', () => {
    const result = validateQRPayload('token💕value');
    expect(result.valid).toBe(false);
    expect(result.token).toBeNull();
  });

  it('trims whitespace from valid token', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = validateQRPayload(`  ${uuid}  `);
    expect(result.valid).toBe(true);
    expect(result.token).toBe(uuid);
  });

  it('does not throw on extremely long input — safe for untrusted QR data', () => {
    expect(() => validateQRPayload('a'.repeat(10_000))).not.toThrow();
  });

  it('returns a generic error message — no internal detail exposed', () => {
    const result = validateQRPayload('');
    expect(result.error).toBe("That doesn't look like a valid CoupleGoAI code.");
  });
});
