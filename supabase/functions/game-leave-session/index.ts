// =============================================================================
// game-leave-session — Cancel an active game session
// =============================================================================

import "@supabase/functions-js/edge-runtime.d.ts";
import { makeCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


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

  const { sessionId } = body as { sessionId: string };
  if (typeof sessionId !== "string") {
    return json({ error: "Invalid session ID" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user is a player in this session
  const { data: player, error: playerError } = await supabase
    .from("game_session_players")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (playerError || !player) {
    return json({ error: "Session not found" }, 404);
  }

  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return json({ error: "Session not found" }, 404);
  }

  const s = session as { id: string; status: string };
  if (s.status !== "waiting" && s.status !== "active") {
    return json({ error: "Session is not active" }, 410);
  }

  const nowIso = new Date().toISOString();

  await supabase
    .from("game_sessions")
    .update({ status: "cancelled", cancelled_at: nowIso })
    .eq("id", sessionId);

  return json({ cancelled: true });
});
