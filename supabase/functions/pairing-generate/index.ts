// =============================================================================
// pairing-generate — Create a single-use QR pairing token (5-min TTL)
//
// Auth:  JWT verified via Auth REST API (ES256 compatible) — MUST-1
// Token: crypto.randomUUID() — never predictable — MUST-3
// user_id from auth response only — MUST-2, MUST-NOT-2
// service_role client after auth verification — MUST-NOT-3
// verify_jwt = false in config.toml (ES256 incompatibility with gateway HS256)
// =============================================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

  // MUST-1: Verify JWT via Auth REST API — never client.auth.getUser()
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey },
  });
  if (!authResp.ok) return json({ error: "Unauthorized" }, 401);

  // MUST-2: derive user identity from auth response only
  const authUser = await authResp.json() as { id: string };
  const userId = authUser.id;

  // MUST-NOT-3: service_role client only after auth verification
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Reject already-paired users
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", userId)
    .single();

  if (profileError) return json({ error: "Failed to read profile" }, 500);
  if (profile?.couple_id) return json({ error: "Already paired" }, 409);

  // Invalidate any existing unused tokens for this user
  await supabase
    .from("pairing_tokens")
    .update({ used: true })
    .eq("creator_id", userId)
    .eq("used", false);

  // MUST-3: crypto-random token; expires in exactly 5 minutes (server-enforced)
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("pairing_tokens")
    .insert({ creator_id: userId, token, expires_at: expiresAt });

  if (insertError) return json({ error: "Failed to create token" }, 500);

  return json({ token, expiresAt });
});
