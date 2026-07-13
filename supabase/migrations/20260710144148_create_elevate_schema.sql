/*
# Elevate Academy — Core Schema (single-tenant, no auth)

1. Purpose
   A premium educational platform for "Achiever 8.0" featuring English Grammar,
   Vocabulary, and Reading Comprehension. Admins manage subjects, chapters, and
   lectures (video + PDF). Learners browse, watch, and track progress. No sign-in
   is required — the app is intentionally public/shared, so policies use
   `TO anon, authenticated`.

2. New Tables
   - `subjects`  — top-level categories (Grammar, Vocabulary, Reading Comprehension)
     - id, slug, title, description, icon, color, gradient, sort_order,
       created_at, updated_at
   - `chapters` — chapters within a subject (e.g. Parts of Speech, Noun, Tense)
     - id, subject_id (FK), slug, title, description, sort_order, created_at
   - `lectures` — individual lectures within a chapter
     - id, chapter_id (FK), slug, title, description, video_url, pdf_url,
       thumbnail_url, duration_seconds, is_new, is_pinned, sort_order,
       created_at, updated_at
   - `progress` — per-lecture watch progress (resume watching)
     - id, lecture_id (FK), position_seconds, completed, updated_at
     - Single row per lecture (unique on lecture_id)

3. Security
   - RLS enabled on all tables.
   - All tables allow anon + authenticated full CRUD because the data is
     intentionally public/shared (no-auth app). Admin writes happen via the
     same anon key from the admin dashboard.

4. Notes
   - Foreign keys cascade on delete to keep the tree clean.
   - `sort_order` defaults to 0; UI reorders by it then by created_at.
   - `progress.position_seconds` lets the player resume where the learner left off.
*/

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'BookOpen',
  color text NOT NULL DEFAULT 'blue',
  gradient text NOT NULL DEFAULT 'from-blue-500 to-cyan-500',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (subject_id, slug)
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
CREATE POLICY "anon_select_chapters" ON chapters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
CREATE POLICY "anon_insert_chapters" ON chapters FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;
CREATE POLICY "anon_update_chapters" ON chapters FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;
CREATE POLICY "anon_delete_chapters" ON chapters FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text,
  video_url text,
  pdf_url text,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  is_new boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (chapter_id, slug)
);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lectures" ON lectures;
CREATE POLICY "anon_select_lectures" ON lectures FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lectures" ON lectures;
CREATE POLICY "anon_insert_lectures" ON lectures FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lectures" ON lectures;
CREATE POLICY "anon_update_lectures" ON lectures FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lectures" ON lectures;
CREATE POLICY "anon_delete_lectures" ON lectures FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL UNIQUE REFERENCES lectures(id) ON DELETE CASCADE,
  position_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_progress" ON progress;
CREATE POLICY "anon_select_progress" ON progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON progress;
CREATE POLICY "anon_insert_progress" ON progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON progress;
CREATE POLICY "anon_update_progress" ON progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_progress" ON progress;
CREATE POLICY "anon_delete_progress" ON progress FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_lectures_chapter_id ON lectures(chapter_id);
CREATE INDEX IF NOT EXISTS idx_lectures_is_pinned ON lectures(is_pinned);
CREATE INDEX IF NOT EXISTS idx_lectures_is_new ON lectures(is_new);
CREATE INDEX IF NOT EXISTS idx_progress_lecture_id ON progress(lecture_id);
