// account-delete — Right-to-erasure entrypoint.
//
// Flow:
//   1. Verify the caller's JWT via the Auth REST API (same pattern as the
//      other functions — ES256 signing bypasses the Supabase gateway check).
//   2. Call the `delete_user_data(uid)` RPC, which runs with SECURITY
//      DEFINER inside Postgres and atomically wipes every row tied to
//      this user across every table, plus triggers the
//      `on_auth_user_deleted` trigger for defense-in-depth cleanup.
//   3. Return 204 No Content on success.
//
// This function never logs message content, emails, or tokens. Only the
// correlation id, the userId, and a coarse status make it into logs.

import "@supabase/functions-js/edge-runtime.d.ts";
import { makeCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "@supabase/supabase-js";
import { logError, logInfo, newCorrelationId } from "../_shared/log.ts";


function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...makeCorsHeaders(), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: makeCorsHeaders() });
  }
  if (req.method !== "POST" && req.method !== "DELETE") {
    return json({ error: "Method not allowed" }, 405);
  }

  const correlationId = newCorrelationId();
  const feature = "account-delete";

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify JWT via Auth REST API
  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey },
  });
  if (!authResp.ok) return json({ error: "Unauthorized" }, 401);

  const authUser = (await authResp.json()) as { id: string };
  const userId = authUser.id;

  logInfo({ feature, event: "request_received", correlationId, userId });

  // Service-role client — only after auth verification.
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { error } = await supabase.rpc("delete_user_data", { p_uid: userId });
    if (error) {
      logError({
        feature,
        event: "rpc_failed",
        code: error.code ?? "unknown",
        correlationId,
        userId,
      });
      return json({ error: "Failed to delete account" }, 500);
    }
  } catch (err) {
    const code = err instanceof Error ? err.message : "unknown";
    logError({ feature, event: "rpc_threw", code, correlationId, userId });
    return json({ error: "Failed to delete account" }, 500);
  }

  logInfo({ feature, event: "deleted", correlationId, userId, status: 204 });

  return new Response(null, { status: 204, headers: makeCorsHeaders() });
});
