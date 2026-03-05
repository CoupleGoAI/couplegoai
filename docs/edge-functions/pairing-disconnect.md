# Edge Function: `pairing-disconnect`

## Purpose

Deactivates an existing couple relationship. Both users' `couple_id` is cleared and the couple record is marked as inactive. Either partner can initiate the disconnect.

## Client invocation

```ts
const result = await invokeEdgeFunction<PairingDisconnectResponse>('pairing-disconnect');
```

## Auth

Requires valid JWT. User identity extracted via `supabase.auth.getUser()`.

## Input

No body required (empty object `{}`).

## Output

```ts
{
  ok: boolean; // true on success
}
```

## Business logic

1. Verify user identity from JWT.
2. Look up user's `couple_id` from `profiles`. If null, return error (not paired).
3. Look up the couple record from `couples`.
4. **Atomically** (within a transaction or using service role):
   a. Set `couples.is_active = false` and `couples.disconnected_at = now()`.
   b. Clear `couple_id` on both partner profiles (`partner1_id` and `partner2_id`).
5. Return `{ ok: true }`.

## Error responses

| Status | Condition |
|--------|-----------|
| 401    | Missing or invalid JWT |
| 409    | User is not currently paired |
| 500    | Database error |

## Database tables accessed

- `profiles` (read + update) — check paired status, clear couple_id on both users
- `couples` (read + update) — deactivate couple record

## Security notes

- Either partner can initiate disconnect — no "owner" distinction.
- All writes must be atomic to prevent inconsistent state.
- The function uses the service role key for multi-table writes, but verifies user identity from JWT first.
- Generic error messages returned to client.

## Implementation skeleton

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth token' }), { status: 401 });
  }

  // User-scoped client for auth verification
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid auth token' }), { status: 401 });
  }

  // Service-role client for atomic multi-table writes
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // TODO: Look up user's couple_id from profiles
  // TODO: Verify user is currently paired
  // TODO: Look up couple record
  // TODO: Atomically deactivate couple + clear couple_id on both profiles
  // TODO: Return { ok: true }

  return new Response(JSON.stringify({ ok: true }));
});
```
