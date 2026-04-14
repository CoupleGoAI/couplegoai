# Agent Orchestration Policy

This repository uses a shared orchestration policy for Claude, Codex, and Cursor.

## Goal

Improve agent capability while keeping context usage low.

## Default Routing

- Prefer repo-local shared skills over repeating large project instructions from scratch.
- Load only the smallest matching skill set for the task.
- Keep execution direct when the task is already well-scoped.

## Skill Routing

- React Native or Expo work: load `.agents/skills/react-native/SKILL.md`.
- UI polish, screens, layout, or presentation work: also load `.agents/skills/frontend-design/SKILL.md`.
- SQL, migrations, RLS, indexes, or query tuning: also load `.agents/skills/supabase-postgres-best-practices/SKILL.md`.
- Skill discovery or installation: load `.agents/skills/find-skills/SKILL.md`.
- Commit splitting: load `.agents/skills/commit-slices/SKILL.md`.

## Context-Economy Tools

`caveman`, `lean-ctx`, and `symdex` are part of the working setup and should be used deliberately to reduce context usage.

- Use `symdex` first when you need symbol lookup, call-site discovery, or entry-point mapping.
- Use `lean-ctx` when docs, diffs, or file sets are too large to keep verbatim in context.
- Use `caveman` when the task requires broad repo archaeology or tracing patterns across multiple areas.
- Do not invoke these tools ceremonially. Use them when they reduce the working set or avoid loading unnecessary files.

## Guardrails

- Do not shotgun-load every skill because it exists.
- Do not infer database state from memory; inspect it live.
- Prefer references and targeted file reads over loading long documents wholesale.
- Keep changes deterministic and minimal.
