// =============================================================================
// game-cancel-invitation — Cancel a pending invitation the user sent
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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey },
  });
  if (!authResp.ok) return json({ error: "Unauthorized" }, 401);

  const authUser = (await authResp.json()) as { id: string };
  const userId = authUser.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const { invitationId } = body as { invitationId: string };
  if (typeof invitationId !== "string") {
    return json({ error: "Invalid invitation ID" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: invitation, error: invError } = await supabase
    .from("game_invitations")
    .select("id, from_user_id, status")
    .eq("id", invitationId)
    .single();

  if (invError || !invitation) {
    return json({ error: "Invitation not found" }, 404);
  }

  const inv = invitation as { id: string; from_user_id: string; status: string };

  if (inv.from_user_id !== userId) {
    return json({ error: "Invitation not found" }, 404);
  }
  if (inv.status !== "pending") {
    return json({ error: "Invitation is no longer pending" }, 410);
  }

  await supabase
    .from("game_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId);

  return json({ cancelled: true });
});
