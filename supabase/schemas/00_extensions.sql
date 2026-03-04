-- =============================================================================
-- CoupleGoAI — Extensions
-- =============================================================================
-- Enable required Postgres extensions.
-- moddatetime: auto-update updated_at columns via trigger.
-- =============================================================================

create extension if not exists "moddatetime" with schema "extensions";
