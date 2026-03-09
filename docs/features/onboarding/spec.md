## Feature: Onboarding Chat (Deterministic, No AI)

### What

After first login (when `onboarding_completed === false`), the user is dropped into an onboarding **chat** that collects a small set of basic profile fields through a conversational flow. **Cannot be skipped.** The "assistant" is **not an LLM** — it is a deterministic state machine in the `onboarding-chat` Edge Function that:

- sends predefined assistant messages (warm, playful, Gen Z tone — multiple variants per step, picked randomly for variety)
- validates user replies (empty/irrelevant → friendly re-ask, also varied)
- persists messages + extracted structured fields
- completes onboarding by setting `profiles.onboarding_completed = true`

This is **not a form**. UI stays as chat.

---

## Questions (4 total)

Asked one at a time, in this order:

1. **First name**
2. **Birth date** (user types free-form; server parses + normalizes)
3. **Dating start date** (same: free-form; server parses + normalizes)
4. **What kind of help do you want?** (tappable chips in UI; server still validates strictly)

**Help options (canonical values):**

- `communication`
- `conflict`
- `trust`
- `emotional_connection`
- `intimacy`
- `other`

---

## Screens

- **OnboardingChatScreen** — full-screen chat UI, no tabs, no back, no skip
- Reuses the same chat bubble components as the main AI chat feature
- Shows a **typing indicator** (300–600ms delay, pure client-side) before each assistant message to sell the conversational feel
- Help type question renders **tappable chips** for the 6 options instead of a text input
- After completion: navigate to partner connection flow (GenerateQR/ScanQR) or Main tabs

---

## Flow

1. Assistant greets user → asks first name
2. User replies → validate name → ask birth date
3. User replies → parse/validate birth date → ask dating start date
4. User replies → parse/validate dating start date → ask help type
5. User selects chip (or types) → validate option → function sets `onboarding_completed=true` → navigate forward

If an answer is empty/invalid, assistant re-asks the same question with a friendly hint (varied phrasing).

---

## Data access (Supabase-native — no REST endpoints)

| Operation     | Method                           | Notes                                                     |
| ------------- | -------------------------------- | --------------------------------------------------------- |
| Check status  | Direct DB query on `profiles`    | Read `onboarding_completed`                               |
| Fetch history | Direct DB query on `messages`    | `conversation_type='onboarding'`, ordered by `created_at` |
| Send message  | Edge function: `onboarding-chat` | Deterministic logic + validation + persistence            |

### `onboarding-chat` Edge Function contract

**Input:** `{ message?: string }`

- If `message` is omitted/empty → function returns the current assistant question (resume/start).
- If `message` exists → function validates it against current question, persists it, and returns next assistant message.

**Output:** `{ reply, questionIndex, isComplete }`

- `reply: string` — assistant message to display next (question or re-ask)
- `questionIndex: number` — 0..3 (current question after processing)
- `isComplete: boolean` — true only when onboarding is finished

---

## State / progress

- Progress indicator uses `questionIndex` (e.g. "2 of 4")
- On completion, client updates `authStore` (refresh profile or set local flag) and navigates forward.

---

## Backend responsibilities (no AI)

The `onboarding-chat` Edge Function is the single source of truth for:

- current onboarding step (derived from persisted state, resumable)
- assistant prompts (multiple predefined variants per step, randomly selected)
- deterministic validation and normalization
- storing both chat history and structured fields

### Date parsing

Use **`chrono-node`** (via `https://esm.sh/chrono-node@2`) for free-form date parsing server-side. Handles formats like "March 12, 1997", "12/03/97", "1997-03-12" without custom regex. Client never parses dates.

### Validation & normalization rules

**1) First name**

- trimmed, 2–50 chars
- letters/spaces/`'`/`-` only (reject numbers/emojis)
- on fail → re-ask with hint (varied: "Just your first name 😊 Letters only!")

**2) Birth date**

- parse with `chrono-node`
- normalize and store as `YYYY-MM-DD`
- must be in the past
- derived age within 16–110
- on fail → re-ask with examples (varied: "Try: 1997-03-12 or 12 March 1997")

**3) Dating start date**

- parse with `chrono-node`
- normalize/store as `YYYY-MM-DD`
- must be in the past
- must be after birth date
- on fail → re-ask with examples (varied)

**4) Help type**

- must match canonical set: `communication | conflict | trust | emotional_connection | intimacy | other`
- UI presents chips so user rarely types; backend validates strictly regardless
- on fail → re-ask and list options

### Response variety

Each step has 2–3 prompt variants and 2 re-ask variants. Server picks randomly:

```typescript
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
```

### Persistence targets

- Chat messages → `messages` with `conversation_type='onboarding'`
- Extracted fields → `profiles`: `name`, `birth_date`, `dating_start_date`, `help_focus`
- `onboarding_completed = true` set at the end

Resumability: function derives current step from stored profile fields (null = not yet answered).

---

## Done when

- [ ] After first login, user enters onboarding chat automatically
- [ ] Assistant asks 4 questions conversationally (not a form)
- [ ] Help type rendered as tappable chips
- [ ] Typing indicator shown before each assistant message
- [ ] Empty/invalid answers get a friendly re-ask (varied phrasing)
- [ ] Onboarding cannot be skipped or backed out of
- [ ] On completion, profile fields are saved and `onboarding_completed=true`
- [ ] Resumable — if user kills app mid-onboarding, resumes at the right step

---

## Notes

- Keep assistant tone warm, playful, Gen Z
- Keep questions short and one at a time
- Backend owns all validation/normalization/date parsing; client is a thin chat shell
- No LLM calls anywhere in onboarding
- Typing indicator is pure client-side (setTimeout + Reanimated), no backend change
