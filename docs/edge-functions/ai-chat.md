# Edge Function: `ai-chat`

## Purpose

Handles the main AI chat feature. Receives user messages, processes them through the AI with full conversation history for context, and persists both user and AI messages to the database.

## Client invocation

```ts
const result = await invokeEdgeFunction<AiChatResponse>('ai-chat', { content });
```

## Auth

Requires valid JWT. User identity extracted via `supabase.auth.getUser()`.

## Input

```ts
{
  content: string; // User's message text
}
```

## Output

```ts
{
  userMessage: {
    id: string;
    role: 'user';
    content: string;
    created_at: string;
  };
  aiReply: {
    id: string;
    role: 'assistant';
    content: string;
    created_at: string;
  };
}
```

## Business logic

1. Verify user identity from JWT.
2. Validate input: non-empty, within length limits.
3. Load recent conversation history from `messages` table (`conversation_type = 'chat'`).
4. Insert user message into `messages` table.
5. Send conversation context + user message to AI (OpenAI / Anthropic).
6. Insert AI reply into `messages` table.
7. Return both messages with their DB-generated IDs and timestamps.

## Error responses

| Status | Condition |
|--------|-----------|
| 401    | Missing or invalid JWT |
| 400    | Empty message or exceeds length limit |
| 500    | AI service error or database error |

All error messages are generic — no PII, tokens, or stack traces.

## Database tables accessed

- `messages` (read + insert) — conversation history (`conversation_type = 'chat'`)

## Security notes

- AI prompt engineering must prevent prompt injection attacks.
- User messages are validated on both client and server side.
- RLS ensures each user can only read their own messages.
- The AI personality is configured server-side (warm, supportive, Gen Z-friendly).

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

  const { content } = await req.json();

  if (typeof content !== 'string' || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Message cannot be empty' }), { status: 400 });
  }

  // TODO: Load conversation history from messages table (conversation_type = 'chat')
  // TODO: Insert user message into messages table
  // TODO: Call AI service with conversation context
  // TODO: Insert AI reply into messages table
  // TODO: Return { userMessage, aiReply }

  return new Response(JSON.stringify({ userMessage: {}, aiReply: {} }));
});
```
