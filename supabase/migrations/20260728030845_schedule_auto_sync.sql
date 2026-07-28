/*
# Schedule auto-sync from selectionway source

1. Changes
- Enable pg_cron extension.
- Create a cron job that runs every 30 minutes, invoking the sync-selection-batch edge function via pg_net.
- The edge function fetches new classes from the source API and upserts them into subjects/chapters/lectures.

2. How it works
- pg_cron runs on a schedule (every 30 min).
- It calls net.http_post() (from pg_net) to invoke the edge function endpoint.
- The edge function URL is constructed from the project's edge function endpoint.
- Uses the anon key for authorization.

3. Notes
- The job name is 'sync-selection-batch' for easy identification.
- Safe to re-run: uses DO block to check if job already exists before creating.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  -- Unschedule any existing version to avoid duplicates
  PERFORM cron.unschedule('sync-selection-batch');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule: every 30 minutes
-- The edge function is invoked via pg_net HTTP POST
SELECT cron.schedule(
  'sync-selection-batch',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://fnuplxhfgukdkkvepqck.supabase.co/functions/v1/sync-selection-batch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZudXBseGhmZ3VrZGtrdmVwcWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjQyMjMsImV4cCI6MjA3NzcyNDIyM30.kB8m6qUXGRpWjkmToVq8c8Bz2p6d6vqj5p4w3vK1k2'
      ),
      body := '{}'::jsonb
    );
  $$
);
