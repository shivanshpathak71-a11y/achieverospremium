/*
# Add is_chat column to lectures + enable realtime on comments

1. Schema changes
- Add `is_chat` boolean column to `lectures` (default false).
  Mirrors the source API's `isChat` flag — true when the class supports
  live chat. Used by the frontend to decide whether to show the chat panel.

2. Realtime
- Add the existing `comments` table to the `supabase_realtime` publication
  so the LiveChat component receives INSERT/DELETE events instantly.
- Set REPLICA IDENTITY FULL on comments so DELETE payloads include the
  full row (needed for realtime delete to carry the id).

3. Notes
- The `live_comments` table created in the previous migration is kept as a
  fallback, but the app now uses the `comments` table (which already has
  data and RLS) for live chat. No data is lost.
*/

ALTER TABLE lectures
  ADD COLUMN IF NOT EXISTS is_chat boolean NOT NULL DEFAULT false;

-- Enable realtime on the comments table
ALTER TABLE comments REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
END $$;
