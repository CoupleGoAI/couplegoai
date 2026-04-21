#!/usr/bin/env node
/*
 * set-provider.mjs — flips the AI_PROVIDER secret on the Supabase project
 * configured for the currently-loaded npm environment (see .env.local),
 * then exits.
 *
 * Invoked by the `prod:claude` / `prod:groq` npm scripts BEFORE Expo starts,
 * so the edge-function environment is aligned with what the client will
 * point at.
 *
 * Contract with the rest of the system:
 *   - The provider selection lives entirely server-side (see
 *     supabase/functions/_shared/llm/factory.ts). This script is only about
 *     making sure the edge functions of the target project are running the
 *     intended provider. The Expo client never knows which provider is
 *     active.
 *
 * Required env (loaded by the npm script via `cp .env.prod.<provider>
 * .env.local` before this runs):
 *   SUPABASE_PROJECT_REF   — e.g. "abcd1234efgh"
 *   SUPABASE_ACCESS_TOKEN  — personal access token with secrets:write on
 *                            the project. NEVER commit this.
 *
 * The script will never print secret values; only the operation result.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const [, , provider] = process.argv;
if (!provider || (provider !== "groq" && provider !== "claude")) {
  console.error("usage: node scripts/set-provider.mjs <groq|claude>");
  process.exit(2);
}

// Load .env.local (already copied into place by the npm script) so that
// SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN are available here without
// requiring an extra dotenv dependency.
const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const projectRef = process.env.SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !accessToken) {
  console.error(
    "[set-provider] missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN in .env.local",
  );
  process.exit(1);
}

const child = spawnSync(
  "npx",
  [
    "supabase",
    "secrets",
    "set",
    `AI_PROVIDER=${provider}`,
    "--project-ref",
    projectRef,
  ],
  {
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
    stdio: ["ignore", "inherit", "inherit"],
    shell: process.platform === "win32",
  },
);

if (child.status !== 0) {
  console.error(`[set-provider] failed to set AI_PROVIDER=${provider}`);
  process.exit(child.status ?? 1);
}

console.log(`[set-provider] AI_PROVIDER=${provider} on ${projectRef}`);
