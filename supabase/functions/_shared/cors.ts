// CORS header factory. Reads ALLOWED_ORIGIN from env; falls back to * in dev.
// Set ALLOWED_ORIGIN to your production app domain in Supabase edge function secrets.

import "@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: { env: { get(name: string): string | undefined } };

export function makeCorsHeaders(): Record<string, string> {
  const origin = (Deno.env.get("ALLOWED_ORIGIN") ?? "").trim() || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}
