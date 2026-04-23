// AES-256-GCM message encryption using the Web Crypto API (native in Deno).
// Key never touches the database — stored only as an edge function secret.
//
// Wire format: ENC:v1:<base64-IV>:<base64-ciphertext+tag>
// Old plaintext rows (no prefix) are returned as-is for backward compatibility.

import "@supabase/functions-js/edge-runtime.d.ts";

const PREFIX = "ENC:v1:";
const IV_BYTES = 12;

function b64ToBytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer as ArrayBuffer;
}

function bytesToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", b64ToBytes(keyB64), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(
  plaintext: string,
  keyB64: string,
): Promise<string> {
  const key = await importKey(keyB64);
  const ivBytes = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const iv = ivBytes.buffer as ArrayBuffer;
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encoded,
  );
  return `${PREFIX}${bytesToB64(iv)}:${bytesToB64(cipherBuf)}`;
}

export async function decrypt(
  wire: string,
  keyB64: string,
): Promise<string> {
  if (!wire.startsWith(PREFIX)) return wire; // legacy plaintext row
  const parts = wire.slice(PREFIX.length).split(":");
  if (parts.length !== 2) throw new Error("crypto: malformed wire format");
  const iv = new Uint8Array(b64ToBytes(parts[0]));
  const cipherBuf = b64ToBytes(parts[1]);
  const key = await importKey(keyB64);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    cipherBuf,
  );
  return new TextDecoder().decode(plainBuf);
}
