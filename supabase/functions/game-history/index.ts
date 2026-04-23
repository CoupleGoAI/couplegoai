// =============================================================================
// game-history — Fetch completed game results for the couple
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
    body = {};
  }

  const { limit = 10, offset = 0 } = body as {
    limit?: number;
    offset?: number;
  };

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get user's couple_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.couple_id) {
    return json({ error: "You must be in a couple" }, 400);
  }

  const coupleId = profile.couple_id as string;

  const { data: results, error: resultsError } = await supabase
    .from("game_session_results")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (resultsError) {
    return json({ error: "Failed to fetch history" }, 500);
  }

  const entries = (results ?? []).map((r: Record<string, unknown>) => ({
    sessionId: r.session_id,
    gameType: r.game_type,
    categoryKey: r.category_key,
    compatibilityScore: r.compatibility_score ?? null,
    matchCount: r.match_count,
    roundCount: r.round_count,
    completedAt: r.created_at,
  }));

  return json(entries);
});
