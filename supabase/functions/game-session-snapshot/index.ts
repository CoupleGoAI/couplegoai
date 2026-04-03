// =============================================================================
// game-session-snapshot — Fetch full session state for resume/sync
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

  const { sessionId } = body as { sessionId: string };
  if (typeof sessionId !== "string") {
    return json({ error: "Invalid session ID" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify user is a player
  const { data: player } = await supabase
    .from("game_session_players")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (!player) {
    return json({ error: "Session not found" }, 404);
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return json({ error: "Session not found" }, 404);
  }

  const s = session as Record<string, unknown>;

  // Fetch related data in parallel
  const [{ data: players }, { data: rounds }, { data: answers }] =
    await Promise.all([
      supabase.from("game_session_players").select("*").eq("session_id", sessionId),
      supabase
        .from("game_rounds")
        .select("*")
        .eq("session_id", sessionId)
        .order("round_index", { ascending: true }),
      supabase.from("game_answers").select("*").eq("session_id", sessionId),
    ]);

  return json({
    id: s.id,
    coupleId: s.couple_id,
    invitationId: s.invitation_id ?? null,
    gameType: s.game_type,
    categoryKey: s.category_key,
    status: s.status,
    createdBy: s.created_by,
    startedAt: s.started_at ?? null,
    completedAt: s.completed_at ?? null,
    cancelledAt: s.cancelled_at ?? null,
    lastActivityAt: s.last_activity_at,
    currentRoundIndex: s.current_round_index,
    totalRounds: s.total_rounds,
    version: s.version,
    players: (players ?? []).map(mapPlayer),
    rounds: (rounds ?? []).map(mapRound),
    answers: (answers ?? []).map(mapAnswer),
  });
});

function mapPlayer(r: Record<string, unknown>) {
  return {
    userId: r.user_id,
    state: r.state,
    joinedAt: r.joined_at,
    readyAt: r.ready_at ?? null,
    lastSeenAt: r.last_seen_at,
    disconnectedAt: r.disconnected_at ?? null,
  };
}

function mapRound(r: Record<string, unknown>) {
  return {
    id: r.id,
    sessionId: r.session_id,
    roundIndex: r.round_index,
    status: r.status,
    promptId: r.prompt_id,
    promptPayload: r.prompt_payload,
    categoryKey: r.category_key,
    startedAt: r.started_at ?? null,
    revealedAt: r.revealed_at ?? null,
  };
}

function mapAnswer(r: Record<string, unknown>) {
  return {
    id: r.id,
    sessionId: r.session_id,
    roundId: r.round_id,
    userId: r.user_id,
    answerPayload: r.answer_payload,
    answeredAt: r.answered_at,
  };
}
