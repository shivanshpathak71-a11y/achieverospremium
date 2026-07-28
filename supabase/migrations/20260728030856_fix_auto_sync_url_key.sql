/*
# Fix auto-sync cron job URL and key

1. Changes
- Unschedule the previous (incorrect) sync-selection-batch cron job.
- Reschedule with the correct project URL and anon key.

2. Notes
- The previous migration used a placeholder URL/key. This corrects it.
- Runs every 30 minutes.
*/

DO $$
BEGIN
  PERFORM cron.unschedule('sync-selection-batch');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-selection-batch',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-selection-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb
    );
  $$
);
