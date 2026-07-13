-- Enriched lecture metadata + study tracking tables

-- 1. Add metadata columns to lectures
ALTER TABLE lectures
  ADD COLUMN IF NOT EXISTS watch_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('Beginner','Intermediate','Advanced')) DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lecture_number integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;

-- 2. Update chapter table with chapter_number
ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS chapter_number integer DEFAULT NULL;

-- 3. Comments / Q&A table (per-lecture, anonymous)
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Student',
  body text NOT NULL,
  is_question boolean NOT NULL DEFAULT false,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments FOR DELETE TO anon, authenticated USING (true);

-- 4. Study session tracking (streak + daily time)
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  seconds_studied integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_date)
);
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "study_sessions_select" ON study_sessions;
CREATE POLICY "study_sessions_select" ON study_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "study_sessions_insert" ON study_sessions;
CREATE POLICY "study_sessions_insert" ON study_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "study_sessions_update" ON study_sessions;
CREATE POLICY "study_sessions_update" ON study_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "study_sessions_delete" ON study_sessions;
CREATE POLICY "study_sessions_delete" ON study_sessions FOR DELETE TO anon, authenticated USING (true);

-- 5. Function: increment watch_count atomically
CREATE OR REPLACE FUNCTION increment_watch_count(p_lecture_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE lectures SET watch_count = watch_count + 1 WHERE id = p_lecture_id;
END;
$$;

-- 6. Function: upsert study session seconds
CREATE OR REPLACE FUNCTION upsert_study_seconds(p_seconds integer)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO study_sessions (session_date, seconds_studied)
  VALUES (CURRENT_DATE, p_seconds)
  ON CONFLICT (session_date) DO UPDATE
    SET seconds_studied = study_sessions.seconds_studied + p_seconds,
        updated_at = now();
END;
$$;
