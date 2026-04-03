// =============================================================================
// game-create-invitation — Create a game invitation for the user's partner
//
// Auth: JWT verified via Auth REST API (ES256 compatible)
// User ID derived from auth response only — never from request body
// Service role client after auth verification
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

const VALID_GAME_TYPES = ["how_well_do_you_know_me", "would_you_rather", "this_or_that"];

interface RequestBody {
  gameType: string;
  categoryKey: string;
  roundManifest: Array<{
    promptId: string;
    promptPayload: Record<string, unknown>;
    categoryKey: string;
  }>;
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

  const { gameType, categoryKey, roundManifest } = body as RequestBody;

  if (
    typeof gameType !== "string" ||
    !VALID_GAME_TYPES.includes(gameType)
  ) {
    return json({ error: "Invalid game type" }, 400);
  }

  if (typeof categoryKey !== "string" || categoryKey.length === 0) {
    return json({ error: "Invalid category" }, 400);
  }

  if (
    !Array.isArray(roundManifest) ||
    roundManifest.length === 0 ||
    roundManifest.length > 20
  ) {
    return json({ error: "Invalid round manifest" }, 400);
  }

  for (const round of roundManifest) {
    if (
      typeof round.promptId !== "string" ||
      typeof round.promptPayload !== "object" ||
      round.promptPayload === null ||
      typeof round.categoryKey !== "string"
    ) {
      return json({ error: "Invalid round manifest entry" }, 400);
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Look up user's couple
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.couple_id) {
    return json({ error: "You must be in a couple to play" }, 400);
  }

  const coupleId = profile.couple_id as string;

  // Find partner
  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("partner1_id, partner2_id")
    .eq("id", coupleId)
    .single();

  if (coupleError || !couple) {
    return json({ error: "Couple not found" }, 404);
  }

  const partnerId =
    (couple as { partner1_id: string; partner2_id: string }).partner1_id === userId
      ? (couple as { partner1_id: string; partner2_id: string }).partner2_id
      : (couple as { partner1_id: string; partner2_id: string }).partner1_id;

  // Check for existing pending invitation for this couple
  const { data: existingInvite } = await supabase
    .from("game_invitations")
    .select("id")
    .eq("couple_id", coupleId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (existingInvite) {
    return json({ error: "There is already a pending invitation" }, 409);
  }

  // Check for existing active session
  const { data: existingSession } = await supabase
    .from("game_sessions")
    .select("id")
    .eq("couple_id", coupleId)
    .in("status", ["waiting", "active"])
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    return json({ error: "There is already an active game session" }, 409);
  }

  // Calculate expiration (15 minutes)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // Create invitation with round manifest stored as metadata
  const { data: invitation, error: inviteError } = await supabase
    .from("game_invitations")
    .insert({
      couple_id: coupleId,
      from_user_id: userId,
      to_user_id: partnerId,
      game_type: gameType,
      category_key: categoryKey,
      status: "pending",
      expires_at: expiresAt,
      metadata: { roundManifest },
    })
    .select("id, couple_id, from_user_id, to_user_id, game_type, category_key, status, expires_at, created_at")
    .single();

  if (inviteError || !invitation) {
    return json({ error: "Failed to create invitation" }, 500);
  }

  return json({ invitation });
});
