// =============================================================================
// game-create-invitation — Create a game invitation for the user's partner
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

const VALID_GAME_TYPES = [
  "would_you_rather",
  "who_is_more_likely",
  "this_or_that",
  "never_have_i_ever",
];

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

  const { gameType, categoryKey } = body as {
    gameType: string;
    categoryKey: string;
  };

  if (typeof gameType !== "string" || !VALID_GAME_TYPES.includes(gameType)) {
    return json({ error: "Invalid game type" }, 400);
  }

  if (typeof categoryKey !== "string" || categoryKey.length === 0) {
    return json({ error: "Invalid category" }, 400);
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

  const c = couple as { partner1_id: string; partner2_id: string };
  const partnerId = c.partner1_id === userId ? c.partner2_id : c.partner1_id;

  // Check for existing pending invitation
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

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
    })
    .select("*")
    .single();

  if (inviteError || !invitation) {
    return json({ error: "Failed to create invitation" }, 500);
  }

  return json(mapInvitation(invitation));
});

function mapInvitation(r: Record<string, unknown>) {
  return {
    id: r.id,
    coupleId: r.couple_id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    gameType: r.game_type,
    categoryKey: r.category_key,
    status: r.status,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    respondedAt: r.responded_at ?? null,
    sessionId: r.session_id ?? null,
  };
}
