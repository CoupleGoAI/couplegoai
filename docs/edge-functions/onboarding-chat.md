# Edge Function: `onboarding-chat`

## Purpose

Handles the AI onboarding conversation. The client sends user messages, and this function processes them through the AI, validates answers, tracks question progress, and persists both user and AI messages to the database.

## Client invocation

```ts
const result = await invokeEdgeFunction<OnboardingMessageResponse>('onboarding-chat', { message });
```

## Auth

Requires valid JWT. User identity extracted via `supabase.auth.getUser()`.

## Input

```ts
{
  message: string; // User's message. Empty string triggers the initial AI greeting.
}
```

## Output

```ts
{
  reply: string;         // AI's response text
  questionIndex: number; // Current question number (0-based, up to ~5)
  isComplete: boolean;   // True when all questions are answered
}
```

## Business logic

1. Verify user identity from JWT.
2. If `message` is empty → generate initial greeting + first question.
3. If `message` is non-empty:
   a. Load conversation history from `messages` table (`conversation_type = 'onboarding'`).
   b. Insert user message into `messages` table.
   c. Send conversation context + user message to AI (OpenAI / Anthropic).
   d. AI validates the answer and decides: accept → next question, or re-ask.
   e. Insert AI reply into `messages` table.
4. Count user messages to derive `questionIndex`.
5. If all questions answered:
   a. Set `profiles.onboarding_completed = true`.
   b. Return `isComplete: true`.
6. Return `{ reply, questionIndex, isComplete }`.

## Error responses

| Status | Condition |
|--------|-----------|
| 401    | Missing or invalid JWT |
| 400    | Message exceeds 500 characters |
| 500    | AI service error or database error |

All error messages are generic — no PII, tokens, or stack traces.

## Database tables accessed

- `messages` (read + insert) — conversation history
- `profiles` (read + update) — onboarding completion flag

## Security notes

- AI prompt engineering must prevent prompt injection attacks.
- User messages are sanitized (length-capped) on both client and server side.
- The function uses the service role key internally for writes, but verifies user identity from JWT first.

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

  const { message } = await req.json();

  if (typeof message === 'string' && message.length > 500) {
    return new Response(JSON.stringify({ error: 'Message too long' }), { status: 400 });
  }

  // TODO: Load conversation history from messages table
  // TODO: Call AI service with conversation context
  // TODO: Insert user message + AI reply into messages table
  // TODO: Check if onboarding is complete, update profiles if so
  // TODO: Return { reply, questionIndex, isComplete }

  return new Response(JSON.stringify({ reply: '', questionIndex: 0, isComplete: false }));
});
```
