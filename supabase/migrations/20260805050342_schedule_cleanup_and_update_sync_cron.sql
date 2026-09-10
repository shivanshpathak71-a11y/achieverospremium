-- Schedule the cleanup-old-chat-messages edge function to run every 1 minute
-- and update the sync-source-chat cron to include a timeout so runs don't pile up.

-- First, unschedule the old sync-source-chat job so we can reschedule with a timeout
SELECT cron.unschedule('sync-source-chat');

-- Reschedule sync-source-chat with a 25-second timeout (runs every 10 seconds,
-- so 25s gives ample room while preventing pile-up)
SELECT cron.schedule(
  'sync-source-chat',
  '*/10 * * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-source-chat',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb,
      timeout := 25000
    );
  $$
);

-- Schedule cleanup-old-chat-messages every 1 minute
SELECT cron.schedule(
  'cleanup-old-chat-messages',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/cleanup-old-chat-messages',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhka2J4dXh6ZWRzcXlpY2N3b213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODk1ODQsImV4cCI6MjA5OTI2NTU4NH0.EOVNMVKCBAFHh4TG6oM2Rv41Sb3i6CYUhcsM_z2e-qI'
      ),
      body := '{}'::jsonb,
      timeout := 30000
    );
  $$
);
