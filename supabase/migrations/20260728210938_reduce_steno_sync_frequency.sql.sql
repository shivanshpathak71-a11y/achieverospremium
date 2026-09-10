/*
# Reduce Steno Pitman sync frequency from every 30 min to every 6 hours
# The frequent syncs were causing AppX API rate limiting / account blocks
*/
DO $$
BEGIN
  PERFORM cron.unschedule('sync-steno-pitman');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-steno-pitman',
  '0 */6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-steno-pitman',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb
    );
  $$
);
