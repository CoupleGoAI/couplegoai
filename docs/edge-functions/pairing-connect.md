# Edge Function: `pairing-connect`

## Purpose

Validates a pairing token (from QR scan) and atomically creates a couple record linking both users. Both profiles are updated with the new `couple_id`.

## Client invocation

```ts
const result = await invokeEdgeFunction<PairingConnectResponse>('pairing-connect', { token });
```

## Auth

Requires valid JWT. User identity extracted via `supabase.auth.getUser()`.

## Input

```ts
{
  token: string; // The pairing token scanned from QR code
}
```

## Output

```ts
{
  couple: {
    id: string;
    partner1_id: string;
    partner2_id: string;
    is_active: boolean;
    created_at: string;
  };
  partner: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}
```

## Business logic

1. Verify user identity from JWT (the scanner).
2. Validate `token` input: non-empty string.
3. Look up token in `pairing_tokens` table.
4. Validate token state:
   a. Token exists → if not, return "Invalid or expired pairing code."
   b. Token not expired (`expires_at > now()`) → if expired, return "Pairing code has expired."
   c. Token not already used (`used = false`) → if used, return "Pairing code already used."
   d. Scanner is not the token creator (`creator_id !== user.id`) → if same user, return error.
   e. Neither user is already paired (both `profiles.couple_id IS NULL`).
5. **Atomically** (within a transaction or using service role):
   a. Create `couples` row with `partner1_id = creator_id`, `partner2_id = scanner_id`, `is_active = true`.
   b. Update both `profiles` rows: set `couple_id = new_couple.id`.
   c. Mark token as `used = true`, `used_by = scanner_id`, `couple_id = new_couple.id`.
6. Return the couple record and partner's basic profile info.

## Error responses

| Status | Condition |
|--------|-----------|
| 401    | Missing or invalid JWT |
| 400    | Missing token in request body |
| 404    | Token not found |
| 410    | Token expired |
| 409    | Token already used, user already paired, or scanning own token |
| 500    | Database error |

## Database tables accessed

- `pairing_tokens` (read + update) — validate and mark as used
- `couples` (insert) — create couple record
- `profiles` (read + update) — check paired status, set couple_id on both users

## Security notes

- All validation and writes must be atomic to prevent race conditions (two users scanning the same token simultaneously).
- The function uses the service role key for multi-table writes, but verifies user identity from JWT first.
- Generic error messages returned to client — no internal IDs or token details leaked.
- A user cannot scan their own token.

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

  const { token } = await req.json();

  if (typeof token !== 'string' || token.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Missing pairing code' }), { status: 400 });
  }

  // TODO: Look up token in pairing_tokens
  // TODO: Validate token state (not expired, not used, not self-scan, neither user paired)
  // TODO: Atomically create couple + update both profiles + mark token used
  // TODO: Return { couple, partner }

  return new Response(JSON.stringify({ couple: {}, partner: {} }));
});
```
