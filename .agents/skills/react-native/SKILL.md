---
name: react-native
description: CoupleGoAI React Native routing skill. Use this for Expo, React Native, navigation, Zustand, Reanimated, screen composition, and UI implementation in this repo. It is a thin repo-specific layer that should rely on the installed React Native and frontend design skills instead of restating broad framework guidance.
---

# React Native Skill (CoupleGoAI)

Use this skill for app-side work in this repository.

## Load Order

1. Use the installed `react-native` skill first when the task depends on framework or Expo details.
2. Use `frontend-design` as well when the task changes a screen, visual hierarchy, layout, or motion.
3. Fall back to `AGENTS.md`, `agent-orchestration.md`, and `CLAUDE.md` only for CoupleGoAI-specific rules that are not already covered by those skills.

## Repo-Specific Rules

- Expo managed workflow.
- TypeScript strict mode. No `any`.
- Functional components only.
- Use path aliases from `tsconfig.json`; never use deep relative imports.
- Keep Zustand thin and typed.
- Keep Reanimated worklet-first and subtle.
- Use `src/theme/tokens.ts` as the single source of truth for colors, spacing, radius, and typography.
- No hardcoded hex values in components.

## UX Direction

- Warm, premium, modern, slightly playful.
- Keep cognitive load low.
- Prefer clear hierarchy over dense feature packing.
- Do not let animation delay interaction readiness.

## Context Economy

- Use `symdex` to narrow the component tree before opening multiple screens or shared UI files.
- Use `lean-ctx` if a screen family or navigation flow is too large to keep in full context.
