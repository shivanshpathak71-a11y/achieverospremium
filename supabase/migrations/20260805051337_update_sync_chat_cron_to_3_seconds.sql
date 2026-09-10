-- Update sync-source-chat cron from every 10 seconds to every 3 seconds
-- for near real-time chat delivery. 8-second timeout gives ample room
-- while preventing pile-up at 3-second intervals.

SELECT cron.unschedule('sync-source-chat');

SELECT cron.schedule(
  'sync-source-chat',
  '*/3 * * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-source-chat',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb,
      timeout := 8000
    );
  $$
);
