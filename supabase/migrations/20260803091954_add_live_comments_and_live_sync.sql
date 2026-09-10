/*
# Add live comments table + schedule live-status sync

1. New Tables
- `live_comments`
  - id (uuid, primary key)
  - lecture_id (uuid, FK to lectures, cascade delete)
  - author_name (text, default 'Student')
  - body (text, not null)
  - created_at (timestamptz, default now())
  - Lightweight realtime chat for live classes.

2. Indexes
- idx_live_comments_lecture_id on live_comments(lecture_id, created_at desc)

3. Security
- Enable RLS on live_comments.
- Anon + authenticated can SELECT (public chat, no sign-in).
- Anon + authenticated can INSERT (anyone watching can chat).
- Anon + authenticated can DELETE own comments.
- Realtime enabled via publication.

4. Cron
- Schedule `sync-live-status` every 2 minutes to update is_live / is_blinking
  flags and live video_url for all classes in the Selection Batch 10 source.
*/

-- ─── live_comments table ───
CREATE TABLE IF NOT EXISTS live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Student',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE live_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_comments REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "live_comments_select" ON live_comments;
CREATE POLICY "live_comments_select" ON live_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "live_comments_insert" ON live_comments;
CREATE POLICY "live_comments_insert" ON live_comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "live_comments_delete" ON live_comments;
CREATE POLICY "live_comments_delete" ON live_comments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_live_comments_lecture_id
  ON live_comments(lecture_id, created_at DESC);

-- Enable realtime for live_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'live_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE live_comments;
  END IF;
END $$;

-- ─── Schedule live-status sync every 2 minutes ───
DO $$
BEGIN
  PERFORM cron.unschedule('sync-live-status');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'sync-live-status',
  '*/2 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://hdkbxuxzedsqyiccwomw.supabase.co/functions/v1/sync-live-status',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
      ),
      body := '{}'::jsonb
    );
  $$
);
