/*
# Schedule auto-sync for Steno School Pitman Blueprint course

## What this does
- Creates a cron job that runs every 30 minutes, invoking the sync-steno-pitman edge function.
- The edge function fetches course metadata from the Steno School SSR page and
  upserts it into subjects/chapters/lectures.

## How it works
- pg_cron runs on a schedule (every 30 min).
- It calls net.http_post() (from pg_net) to invoke the edge function endpoint.
- Uses the anon key for authorization.

## Notes
- The job name is 'sync-steno-pitman' for easy identification.
- Safe to re-run: uses DO block to unschedule first.
*/

DO $$
BEGIN
  PERFORM cron.unschedule('sync-steno-pitman');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-steno-pitman',
  '*/30 * * * *',
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
