/*
# Schedule auto-sync for Parmar Academy courses + trigger immediate sync

## What this does
- Creates a cron job that runs every 30 minutes, invoking the sync-parmar-maths edge function.
- Also triggers an immediate sync of Parmar GK Batch 4.0 (course_id=71).
*/

DO $$
BEGIN
  PERFORM cron.unschedule('sync-parmar-maths');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-parmar-maths',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-parmar-maths',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Trigger immediate sync of Parmar GK Batch 4.0 (course_id=71)
SELECT net.http_post(
  url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-parmar-maths',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
  ),
  body := '{"course_id":"71","course_slug":"parmar-gk-batch-4"}'::jsonb
);
