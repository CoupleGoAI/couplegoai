-- Schedule daily message retention cleanup via pg_cron (already installed).
-- Deletes raw messages older than 90 days. Memory summary rows (user_memory,
-- couple_memory) are NOT deleted — they are the distilled, durable record.
--
-- pg_cron runs with superuser privileges inside Postgres, so RLS does not apply.

select cron.schedule(
  'delete-old-messages',
  '0 3 * * *',
  $$delete from public.messages where created_at < now() - interval '90 days'$$
);
