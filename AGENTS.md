# CoupleGoAI Agent Instructions

## Read Order

1. `CLAUDE.md` for project architecture, product constraints, and security rules.
2. `agent-orchestration.md` for shared skill-routing and context-economy rules.
3. `codex.md` for Codex-specific execution defaults.

## Shared Skills

Prefer the smallest matching skill set from `.agents/skills/` instead of reloading broad project context.

- `react-native` for Expo, React Native, navigation, Zustand, Reanimated, and screen-level work.
- `frontend-design` for UI direction, visual polish, layout, motion, and presentation quality.
- `supabase-postgres-best-practices` for SQL, schema, indexes, RLS, and query performance.
- `find-skills` only when the user explicitly asks to discover or install more skills.
- `commit-slices` only when the user explicitly asks to split the diff into coherent commits.

## Context Economy

This repo treats context as a scarce resource.

- Use `symdex` to find symbols, call sites, and narrow the file set before reading large surfaces.
- Use `lean-ctx` to compress long docs, diffs, and exploration notes into a smaller working set.
- Use `caveman` for repo archaeology when the task spans multiple features or historical patterns.
- Do not load every skill or every large file up front. Route to the minimal relevant context first.

## Non-Negotiables

- TypeScript strict mode. No `any`.
- Functional components only.
- Use path aliases, not deep relative imports.
- Use MCP to inspect live Supabase state before schema or query changes.
- Ship the smallest correct diff. No unrelated refactors.
