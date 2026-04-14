# Codex Rules

## Read First

- Follow `AGENTS.md` for repo-wide defaults.
- Follow `agent-orchestration.md` for skill routing and context economy.
- Use `CLAUDE.md` as the source of truth for project architecture, security, and product constraints.

## Shared Skills

Prefer the repo-local skill set in `.agents/skills/` when the task matches:

- `react-native`
- `frontend-design`
- `supabase-postgres-best-practices`
- `find-skills`
- `commit-slices`

Choose the smallest relevant combination instead of loading everything.

## Context Economy

- Use `symdex` for symbol and call-site discovery.
- Use `lean-ctx` to shrink large inputs before continuing.
- Use `caveman` for broad repo archaeology only when the task is genuinely wide.

## Core Rules

- TypeScript `strict` everywhere.
- No `any`, implicit `any`, or unsafe casts.
- Functional components only.
- Use path aliases instead of deep relative imports.
- Query Supabase only after live schema inspection through MCP.
- Prefer the smallest correct diff over refactors.
