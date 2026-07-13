-- Add user_id to existing comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add RLS policies for comments (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'select_comments' AND tablename = 'comments') THEN
    CREATE POLICY "select_comments" ON comments FOR SELECT
      TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own_comment' AND tablename = 'comments') THEN
    CREATE POLICY "insert_own_comment" ON comments FOR INSERT
      TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_own_comment' AND tablename = 'comments') THEN
    CREATE POLICY "delete_own_comment" ON comments FOR DELETE
      TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
