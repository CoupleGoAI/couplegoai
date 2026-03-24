---
name: implement
description: Build a new CoupleGoAI feature end-to-end using the architect → planner → coder pipeline
---

# /implement — New Feature Pipeline

You are implementing a new feature for **CoupleGoAI** using the Ruflo architect → planner → coder pipeline.

**Feature:** $ARGUMENTS

---

## Before starting

Read `CLAUDE.md` and any existing `docs/features/` folder for this feature to load project constraints, architecture rules, Supabase patterns, and the token palette into context.

---

## Step 1 — Architect

Design the feature architecture: component boundaries, data flow (UI → hooks → domain → data), Zustand slice shape, navigation routes, edge function contracts, and security trust boundaries.

Enforce CoupleGoAI rules: ES256 JWT via Auth REST API, `verify_jwt = false`, plain `fetch` (never `supabase.functions.invoke()`), tokens in `expo-secure-store`, all styling via `@/theme/tokens`.

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "architect",
  task_description: "Design feature architecture for CoupleGoAI: $ARGUMENTS. Enforce: layered UI→hooks→domain→data, Zustand thin slice, Reanimated animations, NativeWind+tokens styling, Supabase edge functions with ES256 JWT via Auth REST API.",
  options: { detailed: true, memory_enabled: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run architect "Design feature architecture for CoupleGoAI: $ARGUMENTS. Enforce: layered UI→hooks→domain→data, Zustand thin slice, Reanimated animations, NativeWind+tokens styling, Supabase edge functions with ES256 JWT via Auth REST API."
```

Store the architecture output in memory before proceeding.

---

## Step 2 — Planner

Break down the architect's output into an ordered task list: files to create/modify, types to define, domain logic, data layer, edge functions, UI components, tests. Make dependencies explicit.

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "planner",
  task_description: "Create implementation task plan for CoupleGoAI feature: $ARGUMENTS. Sequence: types → domain → data layer → Zustand store → hooks → UI components → screens → navigation wiring → edge functions → tests. Flag every MUST security requirement.",
  options: { memory_enabled: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run planner "Create implementation task plan for CoupleGoAI feature: $ARGUMENTS. Sequence: types → domain → data layer → Zustand store → hooks → UI components → screens → navigation wiring → edge functions → tests. Flag every MUST security requirement."
```

---

## Step 3 — Coder

Implement every task from the planner's list. Follow all rules from `CLAUDE.md` without exception.

Key constraints:
- TypeScript strict: zero `any`, zero `@ts-ignore`, explicit return types
- Path aliases always (`@/`, `@hooks/*`, etc.) — no deep relative paths
- `className` (NativeWind) for static styling — no hardcoded hex, no inline radius/spacing
- Functions ≤ 30 lines, files ≤ 200 lines
- Unit tests for all domain logic in `src/domain/<feature>/__tests__/`
- `implementation-notes.md` written when done (what was built, files changed, security checklist, how to test)

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "Implement CoupleGoAI feature per the architect and planner output: $ARGUMENTS. Follow CLAUDE.md strictly. Write implementation-notes.md when done.",
  options: { test_driven: true, parallel_edits: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run coder "Implement CoupleGoAI feature per the architect and planner output: $ARGUMENTS. Follow CLAUDE.md strictly. Write implementation-notes.md when done."
```

---

## Step 4 — Verify

After all code is written:

```bash
npx tsc --noEmit
npx jest --passWithNoTests
```

Fix all type errors and test failures before finishing. Report what was built.
