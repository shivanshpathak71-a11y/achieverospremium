/*
# Schedule CodeWithHarry Data Science course auto-sync

1. Changes
- Adds a pg_cron job that triggers the sync-codewithharry-ds edge function every 30 minutes.
- Uses the same pattern as the existing sync-selection-batch and sync-parmar-maths cron jobs.
2. Security
- No schema changes. Uses the existing anon key for edge function auth.
3. Notes
- The cron job name is "sync-codewithharry-ds-cron" for easy identification.
- Schedule: every 30 minutes (same cadence as other course syncs).
*/

SELECT cron.schedule(
  'sync-codewithharry-ds-cron',
  '*/30 * * * *',
  $$
SELECT net.http_post(
  url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-codewithharry-ds',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
  ),
  body := '{}'::jsonb
);
$$
);
