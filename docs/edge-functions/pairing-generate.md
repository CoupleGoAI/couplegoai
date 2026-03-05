# Edge Function: `pairing-generate`

## Purpose

Creates a temporary pairing token for QR-based partner connection. The token has a server-enforced 5-minute TTL. The function ensures the requesting user is not already paired.

## Client invocation

```ts
const result = await invokeEdgeFunction<PairingGenerateResponse>('pairing-generate');
```

## Auth

Requires valid JWT. User identity extracted via `supabase.auth.getUser()`.

## Input

No body required (empty object `{}`).

## Output

```ts
{
  token: string;     // Short unique token string (encoded in QR code)
  expiresAt: string; // ISO 8601 timestamp (5 minutes from now)
}
```

## Business logic

1. Verify user identity from JWT.
2. Check `profiles.couple_id` — if already paired, return error.
3. Invalidate any existing unused tokens created by this user (prevent token accumulation).
4. Generate a cryptographically random token string.
5. Insert into `pairing_tokens` table with `creator_id`, `token`, `expires_at` (now + 5 min), `used = false`.
6. Return `{ token, expiresAt }`.

## Error responses

| Status | Condition |
|--------|-----------|
| 401    | Missing or invalid JWT |
| 409    | User is already paired with a partner |
| 500    | Database error |

## Database tables accessed

- `profiles` (read) — check if user is already paired
- `pairing_tokens` (read + insert + update) — manage tokens

## Security notes

- Token must be cryptographically random (e.g., `crypto.randomUUID()` or equivalent).
- Server enforces the 5-minute TTL — client countdown is cosmetic only.
- Old unused tokens from this user are invalidated on new generation.
- Only the token string is included in the QR code — no PII.

## Implementation skeleton

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 });
  }

  // TODO: Check if user is already paired (profiles.couple_id)
  // TODO: Invalidate any existing unused tokens for this user
  // TODO: Generate cryptographically random token
  // TODO: Insert token into pairing_tokens with 5-min expiry
  // TODO: Return { token, expiresAt }

  return new Response(JSON.stringify({ token: '', expiresAt: '' }));
});
```
