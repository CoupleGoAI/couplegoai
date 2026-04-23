// =============================================================================
// game-submit-answer — Submit an answer for the current round
//
// Auth: JWT verified via Auth REST API (ES256 compatible)
// Idempotent: upserts on (round_id, user_id) unique constraint
// Auto-advances round when both players have answered
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

  const { sessionId, roundId, answerPayload } = body as {
    sessionId: string;
    roundId: string;
    answerPayload: Record<string, unknown>;
  };

  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return json({ error: "Invalid session ID" }, 400);
  }
  if (typeof roundId !== "string" || roundId.length === 0) {
    return json({ error: "Invalid round ID" }, 400);
  }
  if (
    typeof answerPayload !== "object" ||
    answerPayload === null ||
    Array.isArray(answerPayload)
  ) {
    return json({ error: "Invalid answer payload" }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const nowIso = new Date().toISOString();

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

  // Verify session is active
  const { data: session, error: sessionError } = await supabase
    .from("game_sessions")
    .select("id, status, current_round_index, total_rounds, couple_id, game_type, category_key")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return json({ error: "Session not found" }, 404);
  }

  const sess = session as Record<string, unknown>;
  if (sess.status !== "active") {
    return json({ error: "Session is not active" }, 400);
  }

  // Verify round belongs to session and is open
  const { data: round, error: roundError } = await supabase
    .from("game_rounds")
    .select("id, session_id, status, round_index")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    return json({ error: "Round not found" }, 404);
  }

  const rnd = round as Record<string, unknown>;
  if (rnd.session_id !== sessionId) {
    return json({ error: "Round does not belong to this session" }, 400);
  }
  if (rnd.status !== "open") {
    return json({ error: "Round is not open for answers" }, 400);
  }

  // Upsert answer (idempotent on round_id + user_id)
  const { error: answerError } = await supabase
    .from("game_answers")
    .upsert(
      {
        session_id: sessionId,
        round_id: roundId,
        user_id: userId,
        answer_payload: answerPayload,
        answered_at: nowIso,
      },
      { onConflict: "round_id,user_id" },
    );

  if (answerError) {
    return json({ error: "Failed to submit answer" }, 500);
  }

  // Update last activity
  await supabase
    .from("game_sessions")
    .update({ last_activity_at: nowIso })
    .eq("id", sessionId);

  // Check if both players answered
  const { count: answerCount } = await supabase
    .from("game_answers")
    .select("id", { count: "exact", head: true })
    .eq("round_id", roundId);

  const bothAnswered = (answerCount ?? 0) >= 2;

  if (!bothAnswered) {
    return json({ status: "waiting_for_partner", roundId });
  }

  // Both answered — reveal this round
  await supabase
    .from("game_rounds")
    .update({ status: "revealed", revealed_at: nowIso })
    .eq("id", roundId);

  const currentRoundIndex = sess.current_round_index as number;
  const totalRounds = sess.total_rounds as number;
  const isLastRound = currentRoundIndex >= totalRounds - 1;

  if (isLastRound) {
    // Complete session and compute results
    const results = await computeResults(supabase, sessionId, sess);

    await supabase
      .from("game_sessions")
      .update({
        status: "completed",
        completed_at: nowIso,
        last_activity_at: nowIso,
      })
      .eq("id", sessionId);

    return json({
      status: "completed",
      roundId,
      results,
    });
  }

  // Advance to next round
  const nextIndex = currentRoundIndex + 1;

  await supabase
    .from("game_sessions")
    .update({
      current_round_index: nextIndex,
      last_activity_at: nowIso,
    })
    .eq("id", sessionId);

  // Open the next round
  const { data: nextRound } = await supabase
    .from("game_rounds")
    .select("id")
    .eq("session_id", sessionId)
    .eq("round_index", nextIndex)
    .single();

  if (nextRound) {
    await supabase
      .from("game_rounds")
      .update({ status: "open", started_at: nowIso })
      .eq("id", (nextRound as { id: string }).id);
  }

  return json({
    status: "round_revealed",
    roundId,
    nextRoundIndex: nextIndex,
  });
});

async function computeResults(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  session: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  // Fetch all answers for this session grouped by round
  const { data: allAnswers } = await supabase
    .from("game_answers")
    .select("round_id, user_id, answer_payload")
    .eq("session_id", sessionId)
    .order("round_id");

  const answers = (allAnswers ?? []) as Array<{
    round_id: string;
    user_id: string;
    answer_payload: Record<string, unknown>;
  }>;

  // Group answers by round
  const roundAnswers = new Map<string, Array<{
    user_id: string;
    answer_payload: Record<string, unknown>;
  }>>();

  for (const answer of answers) {
    const existing = roundAnswers.get(answer.round_id) ?? [];
    existing.push({ user_id: answer.user_id, answer_payload: answer.answer_payload });
    roundAnswers.set(answer.round_id, existing);
  }

  // Count matches (answers where both players chose the same value)
  let matchCount = 0;
  const roundCount = roundAnswers.size;

  for (const [, roundPair] of roundAnswers) {
    if (roundPair.length === 2) {
      const a = JSON.stringify(roundPair[0].answer_payload);
      const b = JSON.stringify(roundPair[1].answer_payload);
      if (a === b) {
        matchCount++;
      }
    }
  }

  const compatibilityScore =
    roundCount > 0 ? Math.round((matchCount / roundCount) * 100) : 0;

  const summaryPayload = {
    matchCount,
    roundCount,
    compatibilityScore,
  };

  // Insert results
  await supabase.from("game_session_results").upsert(
    {
      session_id: sessionId,
      couple_id: session.couple_id as string,
      game_type: session.game_type as string,
      category_key: session.category_key as string,
      summary_payload: summaryPayload,
      compatibility_score: compatibilityScore,
      match_count: matchCount,
      round_count: roundCount,
    },
    { onConflict: "session_id" },
  );

  return summaryPayload;
}
