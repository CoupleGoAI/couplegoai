// =============================================================================
// game-respond-invitation — Accept or decline a game invitation
// On accept: creates session, players, rounds from client-provided manifest
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

interface RoundManifestEntry {
  promptId: string;
  promptPayload: Record<string, unknown>;
  categoryKey: string;
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

  const parsed = body as {
    invitationId: string;
    response: string;
    roundManifest?: RoundManifestEntry[];
  };

  if (typeof parsed.invitationId !== "string") {
    return json({ error: "Invalid invitation ID" }, 400);
  }
  if (parsed.response !== "accept" && parsed.response !== "decline") {
    return json({ error: "Response must be 'accept' or 'decline'" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: invitation, error: inviteError } = await supabase
    .from("game_invitations")
    .select("*")
    .eq("id", parsed.invitationId)
    .single();

  if (inviteError || !invitation) {
    return json({ error: "Invitation not found" }, 404);
  }

  const inv = invitation as Record<string, unknown>;

  if (inv.to_user_id !== userId) {
    return json({ error: "Invitation not found" }, 404);
  }
  if (inv.status !== "pending") {
    return json({ error: "Invitation is no longer pending" }, 410);
  }
  if (new Date(inv.expires_at as string) < new Date()) {
    await supabase
      .from("game_invitations")
      .update({ status: "expired" })
      .eq("id", parsed.invitationId);
    return json({ error: "Invitation has expired" }, 410);
  }

  const nowIso = new Date().toISOString();

  if (parsed.response === "decline") {
    await supabase
      .from("game_invitations")
      .update({ status: "declined", responded_at: nowIso })
      .eq("id", parsed.invitationId);
    return json({ declined: true });
  }

  // Accept — need round manifest
  const roundManifest = parsed.roundManifest;
  if (!Array.isArray(roundManifest) || roundManifest.length === 0) {
    return json({ error: "Round manifest required for accept" }, 400);
  }

  const coupleId = inv.couple_id as string;
  const fromUserId = inv.from_user_id as string;
  const gameType = inv.game_type as string;
  const categoryKey = inv.category_key as string;
  const totalRounds = roundManifest.length;

  const sessionSeed = crypto.randomUUID().slice(0, 16);

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      couple_id: coupleId,
      invitation_id: parsed.invitationId,
      game_type: gameType,
      category_key: categoryKey,
      status: "active",
      created_by: fromUserId,
      started_at: nowIso,
      last_activity_at: nowIso,
      current_round_index: 0,
      total_rounds: totalRounds,
      session_seed: sessionSeed,
    })
    .select("*")
    .single();

  if (sessionError || !session) {
    return json({ error: "Failed to create game session" }, 500);
  }

  const s = session as Record<string, unknown>;
  const sessionId = s.id as string;

  // Create players
  await supabase.from("game_session_players").insert([
    { session_id: sessionId, user_id: fromUserId, state: "playing", last_seen_at: nowIso },
    { session_id: sessionId, user_id: userId, state: "playing", last_seen_at: nowIso },
  ]);

  // Create rounds
  const roundInserts = roundManifest.map((entry, i) => ({
    session_id: sessionId,
    round_index: i,
    status: i === 0 ? "open" : "pending",
    prompt_id: entry.promptId,
    prompt_payload: entry.promptPayload,
    category_key: entry.categoryKey,
    started_at: i === 0 ? nowIso : null,
  }));

  await supabase.from("game_rounds").insert(roundInserts);

  // Update invitation
  await supabase
    .from("game_invitations")
    .update({ status: "accepted", responded_at: nowIso, session_id: sessionId })
    .eq("id", parsed.invitationId);

  // Return full snapshot
  return json(await buildSnapshot(supabase, sessionId, s));
});

async function buildSnapshot(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  s: Record<string, unknown>,
) {
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

  return {
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
  };
}

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
