# CoupleGoAI — Supabase Edge Functions

> This folder documents every Supabase Edge Function used by CoupleGoAI.
> Each file describes one function: its purpose, input/output contract, auth requirements, and implementation skeleton.

## Overview

The mobile client talks **only** to Supabase:

- **Direct DB queries** (via `supabaseQuery()` / `supabase.from(...)`) for simple reads and RLS-protected writes.
- **Edge Functions** (via `invokeEdgeFunction()` / `supabase.functions.invoke()`) for complex business logic, AI processing, and atomic multi-table operations.

There is **no custom REST server** and **no third-party API**. All backend logic lives in these edge functions.

## Function inventory

| Function               | File                                    | Purpose                                                          |
| ---------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `onboarding-chat`      | [onboarding-chat.md](./onboarding-chat.md) | AI conversation for profile collection during onboarding      |
| `ai-chat`              | [ai-chat.md](./ai-chat.md)             | Private AI conversation with persistent history                  |
| `pairing-generate`     | [pairing-generate.md](./pairing-generate.md) | Create a pairing token for QR-based partner connection       |
| `pairing-connect`      | [pairing-connect.md](./pairing-connect.md)   | Validate pairing token and create couple record              |
| `pairing-disconnect`   | [pairing-disconnect.md](./pairing-disconnect.md) | Deactivate couple and clear partner links                |

## Auth pattern (shared)

All edge functions follow the same auth pattern:

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

  // ... function-specific logic using `user.id` and `supabase` client ...
});
```

The client calls these via `supabase.functions.invoke('function-name', { body: { ... } })`,
which automatically attaches the current session's access token.

## Deployment

Edge functions will be deployed to Supabase using `supabase functions deploy <function-name>`.
Each function lives in `supabase/functions/<function-name>/index.ts`.
