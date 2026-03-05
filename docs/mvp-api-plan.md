# CoupleGoAI — MVP Architecture Plan

> This document is the shared reference for all feature specs. It defines the backend architecture, data model, auth flow, and implementation order.

---

## Backend architecture — Supabase (serverless)

There is **no custom REST server** and **no third-party API**. The backend is entirely Supabase:

| Layer | Tech | Usage |
|-------|------|-------|
| Auth | Supabase Auth | `supabase.auth.*` — sign-up, sign-in, sign-out, session refresh |
| Database | Supabase Postgres + RLS | `supabase.from('...')` — all data reads/writes via PostgREST |
| Business logic | Supabase Edge Functions | `supabase.functions.invoke('function-name', ...)` via `src/data/apiClient.ts` |
| Real-time | Supabase Realtime | `supabase.channel(...)` subscriptions |
| Storage | Supabase Storage | `supabase.storage` for files/images |

### Env vars (never hard-coded)

```
EXPO_PUBLIC_SUPABASE_URL                      — Supabase project URL (also serves as edge function base URL)
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY  — Supabase anon key (public, safe to expose)
```

No separate API URL is needed — the Supabase JS client automatically routes edge function calls to `<SUPABASE_URL>/functions/v1/<function-name>`.

### Auth model

- Session managed entirely by `supabase-js` with `expo-secure-store` adapter — tokens never touch AsyncStorage
- `autoRefreshToken: true` handles silent refresh automatically
- On sign-out: `supabase.auth.signOut()` + reset all Zustand stores
- Access the session anywhere: `supabase.auth.getSession()` — `supabase-js` attaches the Bearer token to all requests automatically (PostgREST queries and Edge Function invocations)

---

## Implementation order

Features must be built in this order (each depends on the previous):

1. **auth** — registration, login, persistent sessions, Supabase client, secure token storage
2. **onboarding** — AI chat-based profile collection after first login
3. **partner-connection** — QR-based pairing, couple creation, disconnect
4. **ai-chat** — private AI conversation with persistent history

---

## Client data layer (`src/data/`)

```
src/data/
  supabase.ts        — Supabase client singleton (expo-secure-store adapter)
  auth.ts            — Typed wrappers around supabase.auth.* methods
  apiClient.ts       — invokeEdgeFunction() for Edge Functions + supabaseQuery() helper for PostgREST
  onboardingApi.ts   — onboarding status (direct DB) + AI message (Edge Function)
  pairingApi.ts      — generate token, connect, disconnect (Edge Functions) + status (direct DB)
  chatApi.ts         — message history (direct DB) + send (Edge Function)
  userApi.ts         — fetch and update user profile (direct DB via PostgREST)
```

### `supabaseQuery<T>` — for Postgres queries

```ts
// Wraps supabase.from('...') calls into ApiResult<T>
const result = await supabaseQuery(() =>
  supabase.from('profiles').select('*').eq('id', userId).single()
);
```

### `invokeEdgeFunction<T>` — for Edge Functions

```ts
// Uses supabase.functions.invoke() — Bearer token attached automatically by supabase-js
const result = await invokeEdgeFunction<ResponseType>('function-name', {
  message: 'hello',
});
```

### When to use Edge Functions vs direct DB queries

- **Direct DB query** (`supabaseQuery`): Simple reads/writes where RLS policies provide sufficient security. Examples: fetch profile, read message history, check onboarding status.
- **Edge Function** (`invokeEdgeFunction`): Complex business logic, multi-table atomic operations, or server-side AI processing. Examples: AI chat, pairing token generation, partner connection/disconnection.

---

## Data model (Supabase Postgres)

All tables live in `supabase/schemas/`. See `supabase/migrations/` for the canonical SQL.

```
profiles (extends auth.users)
  id                UUID (FK → auth.users.id)
  name              text?
  avatar_url        text?
  onboarding_completed  boolean (default false)
  couple_id         UUID? (FK → couples.id)
  created_at        timestamp

couples
  id                UUID
  partner1_id       UUID (FK → profiles.id)
  partner2_id       UUID (FK → profiles.id)
  is_active         boolean
  created_at        timestamp

messages
  id                UUID
  user_id           UUID (FK → profiles.id)
  role              text ('user' | 'assistant')
  content           text
  created_at        timestamp

pairing_tokens
  id                UUID
  creator_id        UUID (FK → profiles.id)
  token             text (unique, short-lived)
  expires_at        timestamp
  used              boolean
```

RLS policies protect all tables. Clients only read/write their own data.

---

## Edge Functions (business logic + AI)

Business logic that must not run on the client goes in Supabase Edge Functions. See `docs/edge-functions/` for detailed specifications.

| Function | Purpose | Why edge function? |
|----------|---------|-------------------|
| `onboarding-chat` | AI conversation for profile collection | Server-side AI processing + message persistence |
| `ai-chat` | Private AI conversation with history | Server-side AI processing + atomic message persistence |
| `pairing-generate` | Create pairing token (server-enforced TTL) | Server-enforced expiry + uniqueness + paired-check |
| `pairing-connect` | Validate token, create couple record | Atomic multi-table writes (couple + both profiles) |
| `pairing-disconnect` | Deactivate couple, clear both profiles | Atomic multi-table writes (couple + both profiles) |

Edge Functions receive the user's JWT automatically from `supabase.functions.invoke()` and verify it via `supabase.auth.getUser()`.

---

## Navigation flow

```
App launch
  → supabase.auth.getSession()
    → No session → LoginScreen
    → Session exists
        → fetch profiles row
          → onboarding_completed=false → OnboardingChatScreen
          → onboarding_completed=true
              → couple_id=null → Partner connection flow (GenerateQR / ScanQR)
              → couple_id exists → Main tabs (Home, Chat, Game, Profile)
```

---

## Screens map (MVP)

| Screen                    | Stack      | Condition                        |
| ------------------------- | ---------- | -------------------------------- |
| LoginScreen               | Auth       | Not authenticated                |
| RegisterScreen            | Auth       | Not authenticated                |
| OnboardingChatScreen      | Onboarding | `onboarding_completed === false` |
| GenerateQRScreen          | Pairing    | Onboarded but no partner         |
| ScanQRScreen              | Pairing    | Onboarded but no partner         |
| ConnectionConfirmedScreen | Pairing    | Just paired                      |
| HomeScreen                | Main tabs  | Fully set up                     |
| ChatScreen                | Main tabs  | Fully set up                     |
| GameScreen                | Main tabs  | Fully set up                     |
| ProfileScreen             | Main tabs  | Fully set up                     |

---

## Out of scope (explicit)

- OAuth / social login
- Forgot password
- Message editing/deletion
- Streaming AI responses
- WebSocket / real-time
- Push notifications
- Analytics
- Shared couple chat
- Partner profile merging
- Truth or Dare backend (game stays local/mock for MVP)
