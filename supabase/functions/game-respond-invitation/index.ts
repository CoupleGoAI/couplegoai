// =============================================================================
// game-respond-invitation — Accept or decline a game invitation
//
// Auth: JWT verified via Auth REST API (ES256 compatible)
// On accept: creates session, players, rounds; sets session to active
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

function generateSessionSeed(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let seed = "";
  for (let i = 0; i < 16; i++) {
    seed += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return seed;
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

  const { invitationId, response } = body as {
    invitationId: string;
    response: string;
  };

  if (typeof invitationId !== "string" || invitationId.length === 0) {
    return json({ error: "Invalid invitation ID" }, 400);
  }

  if (response !== "accept" && response !== "decline") {
    return json({ error: "Response must be 'accept' or 'decline'" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("game_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (inviteError || !invitation) {
    return json({ error: "Invitation not found" }, 404);
  }

  // Verify the invitation is addressed to this user
  if ((invitation as Record<string, unknown>).to_user_id !== userId) {
    return json({ error: "Invitation not found" }, 404);
  }

  if ((invitation as Record<string, unknown>).status !== "pending") {
    return json({ error: "Invitation is no longer pending" }, 410);
  }

  // Check expiration
  const expiresAt = (invitation as Record<string, unknown>).expires_at as string;
  if (new Date(expiresAt) < new Date()) {
    await supabase
      .from("game_invitations")
      .update({ status: "expired" })
      .eq("id", invitationId);
    return json({ error: "Invitation has expired" }, 410);
  }

  const nowIso = new Date().toISOString();

  // Handle decline
  if (response === "decline") {
    const { error: declineError } = await supabase
      .from("game_invitations")
      .update({ status: "declined", responded_at: nowIso })
      .eq("id", invitationId);

    if (declineError) {
      return json({ error: "Failed to decline invitation" }, 500);
    }

    return json({ status: "declined" });
  }

  // Handle accept
  const inv = invitation as Record<string, unknown>;
  const coupleId = inv.couple_id as string;
  const fromUserId = inv.from_user_id as string;
  const gameType = inv.game_type as string;
  const categoryKey = inv.category_key as string;
  const metadata = inv.metadata as { roundManifest?: RoundManifestEntry[] } | null;

  const roundManifest = metadata?.roundManifest;
  if (!Array.isArray(roundManifest) || roundManifest.length === 0) {
    return json({ error: "Invitation is missing round data" }, 400);
  }

  const totalRounds = roundManifest.length;
  const sessionSeed = generateSessionSeed();

  // Create game session
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .insert({
      couple_id: coupleId,
      invitation_id: invitationId,
      game_type: gameType,
      category_key: categoryKey,
      status: "active",
      created_by: fromUserId,
      started_at: nowIso,
      last_activity_at: nowIso,
      current_round_index: 0,
      total_rounds: totalRounds,
      session_seed: sessionSeed,
      version: 1,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return json({ error: "Failed to create game session" }, 500);
  }

  const sessionId = (session as { id: string }).id;

  // Create players
  const { error: playersError } = await supabase
    .from("game_session_players")
    .insert([
      {
        session_id: sessionId,
        user_id: fromUserId,
        state: "playing",
        joined_at: nowIso,
        ready_at: nowIso,
        last_seen_at: nowIso,
      },
      {
        session_id: sessionId,
        user_id: userId,
        state: "playing",
        joined_at: nowIso,
        ready_at: nowIso,
        last_seen_at: nowIso,
      },
    ]);

  if (playersError) {
    // Cleanup session on failure
    await supabase
      .from("game_sessions")
      .update({ status: "cancelled", cancelled_at: nowIso })
      .eq("id", sessionId);
    return json({ error: "Failed to create player entries" }, 500);
  }

  // Create rounds — first round is 'open', rest are 'pending'
  const roundInserts = roundManifest.map(
    (entry: RoundManifestEntry, index: number) => ({
      session_id: sessionId,
      round_index: index,
      status: index === 0 ? "open" : "pending",
      prompt_id: entry.promptId,
      prompt_payload: entry.promptPayload,
      category_key: entry.categoryKey,
      started_at: index === 0 ? nowIso : null,
    }),
  );

  const { error: roundsError } = await supabase
    .from("game_rounds")
    .insert(roundInserts);

  if (roundsError) {
    await supabase
      .from("game_sessions")
      .update({ status: "cancelled", cancelled_at: nowIso })
      .eq("id", sessionId);
    return json({ error: "Failed to create game rounds" }, 500);
  }

  // Update invitation
  const { error: invUpdateError } = await supabase
    .from("game_invitations")
    .update({
      status: "accepted",
      responded_at: nowIso,
      session_id: sessionId,
    })
    .eq("id", invitationId);

  if (invUpdateError) {
    // Non-fatal — session is already created
  }

  // Fetch full session snapshot to return
  const { data: rounds } = await supabase
    .from("game_rounds")
    .select("id, round_index, status, prompt_id, prompt_payload, category_key, started_at, revealed_at")
    .eq("session_id", sessionId)
    .order("round_index", { ascending: true });

  return json({
    session: {
      id: sessionId,
      coupleId,
      gameType,
      categoryKey,
      status: "active",
      currentRoundIndex: 0,
      totalRounds,
      sessionSeed,
      startedAt: nowIso,
    },
    rounds: rounds ?? [],
    players: [fromUserId, userId],
  });
});
