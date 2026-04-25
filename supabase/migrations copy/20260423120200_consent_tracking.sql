-- GDPR consent tracking: record which privacy policy version each user accepted
-- and when. Nullable so existing rows remain valid without a data migration.
-- Edge functions and onboarding flow should set these on account creation or
-- policy version bump.

alter table public.profiles
  add column if not exists privacy_policy_version text,
  add column if not exists privacy_policy_accepted_at timestamp with time zone;
