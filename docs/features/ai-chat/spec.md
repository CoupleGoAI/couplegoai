# Feature: AI Chat

## What

Each user has a private AI chat — their personal relationship advisor. Messages are stored server-side and persist across sessions. The AI uses conversation history for context-aware responses. Partners cannot see each other's chats.

This is the core feature of the app. The chat experience should feel premium: clean typography, generous spacing, smooth animations, and a warm AI personality.

### Screens

- **ChatScreen** (exists) — full chat interface in the Chat tab. Message list + input bar.
  - User messages on the right (pink/brand), AI messages on the left (neutral)
  - Typing indicator when AI is responding
  - Pull-to-load older messages (paginated)
  - Auto-scroll to bottom on new message
  - Input bar with send button, keyboard-aware

### Flow

1. User opens Chat tab → load message history directly from Supabase (paginated, newest first)
2. User types message → send to edge function → show optimistic "sending" state
3. Edge function processes with AI (uses conversation history for context) → returns response
4. AI response appears with typing indicator animation → then full message

### Data access (Supabase-native — no REST endpoints)

| Operation        | Method                                      | Notes                                                 |
| ---------------- | ------------------------------------------- | ----------------------------------------------------- |
| Fetch messages   | Direct DB query on `messages`               | `conversation_type = 'chat'`, paginated via cursor + limit, ordered by `created_at` desc. RLS ensures privacy — user can only read their own messages |
| Send message     | Edge function: `ai-chat`                    | Handles AI processing, persists both user message + AI reply to `messages` table. Input: `{ content }`. Output: `{ userMessage, aiReply }` |

Simple request-response for MVP. No streaming, no WebSocket — just invoke edge function and get the AI reply back. Streaming is a future enhancement.

The edge function is used for sending because it requires server-side AI processing and atomic persistence of both the user message and AI reply.

### State

- `chatStore` (exists, needs rework): `messages[]`, `isAiTyping`, `isLoading`, `cursor`, `hasMore`
- Messages in store are the local cache. Source of truth is Supabase.
- On app open / tab focus: fetch latest messages
- Optimistic send: add user message to store immediately, mark as "sending", update to "sent" on edge function response

### Message types

```ts
type MessageRole = "user" | "assistant"; // simplified from current 'user' | 'partner' | 'ai'

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status: "sending" | "sent" | "error";
}
```

## Done when

- [ ] User can send a message and receive an AI response
- [ ] Chat history persists across app restarts (loaded from Supabase)
- [ ] AI uses previous conversation context for relevant responses
- [ ] Messages paginate (load more on scroll up)
- [ ] Typing indicator shown while AI is processing
- [ ] Chat is private — no access to partner's messages

## Notes

- Remove hardcoded mock messages from current chatStore
- Remove `partner` role from messages — this is a private 1:1 with AI, not a group chat
- The AI personality should be warm, supportive, Gen Z-friendly — configured in the edge function
- Input validation: don't send empty messages, trim whitespace
- Show error state if send fails, with retry option
- No message editing or deletion in MVP
- No real-time sync needed — this is a personal chat, not shared
- The existing ChatScreen has UI scaffolding but needs wiring to Supabase + edge function
