---
name: modify
description: Change or extend an existing CoupleGoAI feature using the architect → planner → coder pipeline
---

# /modify — Feature Modification Pipeline

You are modifying an existing **CoupleGoAI** feature using the Ruflo architect → planner → coder pipeline.

**Change:** $ARGUMENTS

---

## Before starting

1. Read `CLAUDE.md` to load project rules into context.
2. Identify the feature being modified from the change description.
3. Read the feature's existing docs: `docs/features/<feature>/plan.md`, `threat-model.md`, `implementation-notes.md`.
4. Read every source file listed under **Files changed** in `implementation-notes.md`.

Do not touch anything until you have read all of the above. Stop and report if docs are missing.

---

## Step 1 — Architect

Scope the change: what is the minimal set of files, types, and interfaces that must change? What stays the same? Identify any security MUSTs from `threat-model.md` that are touched by this diff.

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "architect",
  task_description: "Scope a targeted modification to an existing CoupleGoAI feature. Change: $ARGUMENTS. Identify minimal file set, changed types, touched security MUSTs from threat-model.md, and any Zustand slice updates needed. Do not redesign what already works.",
  options: { detailed: true, memory_enabled: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run architect "Scope a targeted modification to an existing CoupleGoAI feature. Change: $ARGUMENTS. Identify minimal file set, changed types, touched security MUSTs from threat-model.md, and any Zustand slice updates needed. Do not redesign what already works."
```

---

## Step 2 — Planner

Produce an ordered task list for only the files and logic identified by the architect. Flag any security MUSTs that must be re-verified after the change.

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "planner",
  task_description: "Plan targeted code changes for CoupleGoAI modification: $ARGUMENTS. List only files that must change. Sequence edits to avoid breakage. Mark each security MUST that the diff touches and how it will remain satisfied.",
  options: { memory_enabled: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run planner "Plan targeted code changes for CoupleGoAI modification: $ARGUMENTS. List only files that must change. Sequence edits to avoid breakage. Mark each security MUST that the diff touches and how it will remain satisfied."
```

---

## Step 3 — Coder

Apply the minimal diff described by the planner. Follow all `CLAUDE.md` rules.

Scope rules:
- Change only files in the planner's list — nothing else
- Do not refactor, reorganise, or improve unrelated code
- If you spot an unrelated issue, note it under **Deferred observations** in `implementation-notes.md`
- Re-verify every MUST from `threat-model.md` touched by this diff

### Option 1: MCP (preferred)
```javascript
mcp__claude-flow__sparc_mode {
  mode: "coder",
  task_description: "Apply targeted modification to CoupleGoAI per architect and planner output: $ARGUMENTS. Minimal diff only. Append a Modification section to implementation-notes.md when done.",
  options: { parallel_edits: true }
}
```

### Option 2: CLI fallback
```bash
npx ruflo sparc run coder "Apply targeted modification to CoupleGoAI per architect and planner output: $ARGUMENTS. Minimal diff only. Append a Modification section to implementation-notes.md when done."
```

---

## Step 4 — Verify

```bash
npx tsc --noEmit
npx jest --passWithNoTests
```

Fix all errors. Then update `docs/features/<feature>/implementation-notes.md` with a `## Modification — <title>` section covering: what changed, files modified, security re-check, deferred observations.
