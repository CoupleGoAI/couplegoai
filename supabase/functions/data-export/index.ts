// data-export — GDPR Article 20 right to data portability.
//
// Returns a JSON bundle of everything the platform holds for the authenticated
// user: profile, messages (decrypted), user memory, memory corrections,
// couple row, couple memory (if applicable).
//
// Security: JWT verified, service_role used with manual ownership checks.
// Logging: only correlation ID + user ID + status. No content ever logged.

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { makeCorsHeaders } from "../_shared/cors.ts";
import { decrypt } from "../_shared/crypto.ts";
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

  const correlationId = newCorrelationId();
  const feature = "data-export";

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encKey = (Deno.env.get("MESSAGES_ENCRYPTION_KEY") ?? "").trim();

  const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: supabaseAnonKey },
  });
  if (!authResp.ok) return json({ error: "Unauthorized" }, 401);

  const authUser = (await authResp.json()) as { id: string; email?: string };
  const userId = authUser.id;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const [profileRes, messagesRes, memoryRes, correctionsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("messages")
        .select("id, role, content, conversation_type, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase.from("user_memory").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("memory_corrections")
        .select("*")
        .eq("created_by", userId)
        .order("created_at", { ascending: true }),
    ]);

    type MsgRow = { id: string; role: string; content: string; conversation_type: string; created_at: string };
    const rawMessages = (messagesRes.data ?? []) as MsgRow[];
    const messages = encKey
      ? await Promise.all(rawMessages.map(async (m) => ({ ...m, content: await decrypt(m.content, encKey) })))
      : rawMessages;

    // Couple data — only if user is in an active couple.
    const profile = profileRes.data as { couple_id?: string | null } | null;
    let coupleData: unknown = null;
    let coupleMemoryData: unknown = null;

    if (profile?.couple_id) {
      const [coupleRes, coupleMemRes] = await Promise.all([
        supabase.from("couples").select("*").eq("id", profile.couple_id).maybeSingle(),
        supabase.from("couple_memory").select("*").eq("couple_id", profile.couple_id).maybeSingle(),
      ]);
      coupleData = coupleRes.data;
      coupleMemoryData = coupleMemRes.data;
    }

    logInfo({ feature, event: "exported", correlationId, userId, status: 200 });

    return json({
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      messages,
      user_memory: memoryRes.data,
      memory_corrections: correctionsRes.data ?? [],
      couple: coupleData,
      couple_memory: coupleMemoryData,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "unknown";
    logError({ feature, event: "export_failed", code, correlationId, userId });
    return json({ error: "Export failed" }, 500);
  }
});
