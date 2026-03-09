// =============================================================================
// MINIMAL onboarding-chat
// - Client → Function: plain fetch with JWT (supabase-js-react-native bug fix)
// - Auth: verified via Auth REST API (handles ES256 correctly)
// - DB: service role client (bypasses JWT verification for DB calls)
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  return json({
    authHeader: authHeader ?? "MISSING",
    anonKeyPrefix: anonKey.slice(0, 15),
    supabaseUrl,
  });
});