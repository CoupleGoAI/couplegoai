````md
# Supabase Edge Functions — CoupleGoAI

Server-side logic that **must not run on the client**.

Use Edge Functions for:

- AI processing
- multi-table atomic operations
- secure token generation
- validation / business logic

Client calls always go through `invokeEdgeFunction()` in `src/data/apiClient.ts`,
which loads the session and explicitly attaches the **JWT Bearer token**:

```ts
invokeEdgeFunction("<function-name>", payload);
```
````

Always ensure the session is loaded before calling `invokeEdgeFunction()`.
`supabase.functions.invoke()` must **not** be called directly from UI code.

---

# Location

```
supabase/functions/
  onboarding-chat/
    index.ts
  ai-chat/
    index.ts
  pairing-generate/
    index.ts
  pairing-connect/
    index.ts
  pairing-disconnect/
    index.ts
```

Each folder = **one deployed function**

Endpoint:

```
<SUPABASE_URL>/functions/v1/<function-name>
```

---

# Auth

All functions require authentication.

Inside function:

```ts
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}
```

---

# Functions

## onboarding-chat

AI onboarding conversation.

Responsibilities

- store user message
- call AI
- store assistant reply
- optionally mark onboarding complete

Request

```json
{ "message": "text" }
```

Response

```json
{ "reply": "text", "onboarding_completed": false }
```

---

## ai-chat

Private AI conversation with history.

Responsibilities

- fetch history
- call AI
- store user + assistant messages

Request

```json
{ "message": "text" }
```

Response

```json
{ "reply": "text" }
```

---

## pairing-generate

Generate short-lived QR pairing token.

Responsibilities

- ensure user not paired
- generate token
- store with expiry

Response

```json
{ "token": "ABC123" }
```

---

## pairing-connect

Connect two users using token.

Responsibilities

- validate token
- create `couples` row
- update both `profiles.couple_id`
- mark token used

Response

```json
{ "couple_id": "uuid" }
```

---

## pairing-disconnect

Disconnect partners.

Responsibilities

- deactivate couple
- clear both `profiles.couple_id`

Response

```json
{ "success": true }
```

---

# Client usage

Client wrappers:

```
src/data/apiClient.ts
```

Example

```ts
await invokeEdgeFunction("ai-chat", { message });
```

Rules

- Never call `supabase.functions.invoke()` directly in UI
- Always use typed wrappers

---

# Error format

```json
{ "error": "message" }
```

Status codes

```
400 invalid request
401 unauthorized
403 forbidden
500 server error
```

---

# Dev workflow

Create

```
supabase functions new <name>
```

Run locally

```
supabase functions serve
```

Deploy

```
supabase functions deploy <name>
```

---

# Rules

- No secrets in client
- AI calls only in Edge Functions
- Multi-table writes only in Edge Functions
- Simple reads/writes use direct DB + RLS

## Supabase client usage inside Edge Functions

1. **Always use a user-scoped client for database operations.** Create the client with
   `SUPABASE_ANON_KEY` and forward the caller's JWT via the `Authorization` header so
   that Row-Level Security (RLS) enforces row-level access automatically:

   ```ts
   const userClient = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_ANON_KEY')!,
     { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
   );
   ```

   Never use the `service_role` admin client unless the operation genuinely requires
   cross-user access (e.g. audit logs, billing, admin tasks). The service role key
   **bypasses RLS entirely** and must not be used for ordinary user-owned data.

2. **The React Native client must always supply the user's JWT.** Load the session
   before invoking an edge function and attach it as a `Bearer` token:

   ```ts
   const { data: { session } } = await supabase.auth.getSession();
   // session must be non-null before calling invokeEdgeFunction
   await supabase.functions.invoke('function-name', {
     body: { ... },
     headers: { Authorization: `Bearer ${session.access_token}` },
   });
   ```

   In practice, always go through `invokeEdgeFunction()` in `src/data/apiClient.ts`,
   which handles session retrieval and header injection for you.
