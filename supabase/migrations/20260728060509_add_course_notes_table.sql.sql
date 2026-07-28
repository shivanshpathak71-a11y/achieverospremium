/*
# Add course_notes table for course-level PDFs/notes

1. New Tables
- `course_notes`
  - `id` (uuid, primary key)
  - `subject_id` (uuid, FK to subjects.id, ON DELETE CASCADE)
  - `source_id` (text, unique — the source API's PDF ID for dedup)
  - `title` (text, not null)
  - `description` (text, nullable)
  - `pdf_url` (text, not null — direct PDF download URL)
  - `teacher_name` (text, nullable)
  - `category_name` (text, nullable — e.g. "Maths")
  - `section_name` (text, nullable — e.g. "Advance")
  - `topic_name` (text, nullable — e.g. "Advance")
  - `is_free` (boolean, default false)
  - `sort_order` (integer, default 0)
  - `source_created_at` (timestamptz, nullable)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)
2. Security
  - Enable RLS on course_notes
  - Anon + authenticated can read (no-auth app)
  - Anon + authenticated can insert/update/delete (admin sync writes via service role, but policies allow anon for consistency)
3. Notes
  - This table stores course-level PDFs/notes that are separate from per-lecture PDFs.
  - These are synced from the selectionway `/pdfs` endpoint.
*/

CREATE TABLE IF NOT EXISTS course_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  source_id text UNIQUE,
  title text NOT NULL,
  description text,
  pdf_url text NOT NULL,
  teacher_name text,
  category_name text,
  section_name text,
  topic_name text,
  is_free boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  source_created_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_course_notes" ON course_notes;
CREATE POLICY "anon_select_course_notes" ON course_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_course_notes" ON course_notes;
CREATE POLICY "anon_insert_course_notes" ON course_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_course_notes" ON course_notes;
CREATE POLICY "anon_update_course_notes" ON course_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_course_notes" ON course_notes;
CREATE POLICY "anon_delete_course_notes" ON course_notes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_course_notes_subject_id ON course_notes(subject_id);
