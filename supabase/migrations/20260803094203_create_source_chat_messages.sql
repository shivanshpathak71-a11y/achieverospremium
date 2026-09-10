/*
# Source chat messages table

1. New Table
- `source_chat_messages`
  - id (uuid, primary key)
  - lecture_id (uuid, FK to lectures, cascade delete)
  - source_message_id (text, unique - dedup key from source API)
  - body (text, not null - filtered message text only)
  - created_at (timestamptz, default now())
  - source_created_at (timestamptz - original timestamp from source)

2. Security
- Enable RLS.
- Anon + authenticated can SELECT (read-only public chat).
- No INSERT/UPDATE/DELETE policies for anon/authenticated — only the
  service role (edge function) can write, ensuring users can't inject
  messages into the mirror.

3. Realtime
- Add to supabase_realtime publication so the LiveChat component
  receives INSERT events instantly.
- REPLICA IDENTITY FULL for complete delete payloads.

4. Indexes
- idx_source_chat_messages_lecture on (lecture_id, source_created_at desc)
- unique on source_message_id for dedup
*/

CREATE TABLE IF NOT EXISTS source_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  source_message_id text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_created_at timestamptz
);

ALTER TABLE source_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chat_messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "source_chat_select" ON source_chat_messages;
CREATE POLICY "source_chat_select" ON source_chat_messages FOR SELECT
  TO anon, authenticated USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_source_chat_messages_source_id
  ON source_chat_messages(source_message_id);

CREATE INDEX IF NOT EXISTS idx_source_chat_messages_lecture
  ON source_chat_messages(lecture_id, source_created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'source_chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE source_chat_messages;
  END IF;
END $$;
