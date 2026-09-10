/*
# Add teachers and folders tables for hierarchical course navigation

## What this does
1. Creates `teachers` table — top-level entity (teacher image, name, bio, subjects count).
2. Creates `folders` table — grouping level between Subject and Chapter.
3. Creates `topics` table — grouping level between Chapter and Lecture.
4. Adds `teacher_id` to `subjects`, `folder_id` to `chapters`, `topic_id` to `lectures`.
5. Seeds one teacher and links existing data.

## Security
- RLS enabled on all new tables with anon+authenticated full access (single-tenant, no auth).
*/

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  image_url text,
  bio text,
  designation text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_read_teachers ON teachers;
CREATE POLICY anon_read_teachers ON teachers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS anon_insert_teachers ON teachers;
CREATE POLICY anon_insert_teachers ON teachers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS anon_update_teachers ON teachers;
CREATE POLICY anon_update_teachers ON teachers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS anon_delete_teachers ON teachers;
CREATE POLICY anon_delete_teachers ON teachers FOR DELETE TO anon, authenticated USING (true);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text DEFAULT 'FolderOpen',
  color text DEFAULT '#f59e0b',
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_read_folders ON folders;
CREATE POLICY anon_read_folders ON folders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS anon_insert_folders ON folders;
CREATE POLICY anon_insert_folders ON folders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS anon_update_folders ON folders;
CREATE POLICY anon_update_folders ON folders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS anon_delete_folders ON folders;
CREATE POLICY anon_delete_folders ON folders FOR DELETE TO anon, authenticated USING (true);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_read_topics ON topics;
CREATE POLICY anon_read_topics ON topics FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS anon_insert_topics ON topics;
CREATE POLICY anon_insert_topics ON topics FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS anon_update_topics ON topics;
CREATE POLICY anon_update_topics ON topics FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS anon_delete_topics ON topics;
CREATE POLICY anon_delete_topics ON topics FOR DELETE TO anon, authenticated USING (true);

-- Add FK columns
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'teacher_id') THEN
    ALTER TABLE subjects ADD COLUMN teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapters' AND column_name = 'folder_id') THEN
    ALTER TABLE chapters ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lectures' AND column_name = 'topic_id') THEN
    ALTER TABLE lectures ADD COLUMN topic_id uuid REFERENCES topics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Seed default teacher
INSERT INTO teachers (slug, name, designation, bio, sort_order)
VALUES ('bhutesh-sir', 'Bhutesh Sir', 'Founder & Lead Faculty', 'Expert educator at Parmar Academy specializing in competitive exam preparation.', 0)
ON CONFLICT (slug) DO NOTHING;

-- Link existing subject to teacher
UPDATE subjects SET teacher_id = (SELECT id FROM teachers WHERE slug = 'bhutesh-sir')
WHERE teacher_id IS NULL;

-- Create default folder for existing subject
INSERT INTO folders (slug, title, description, icon, color, subject_id, sort_order)
SELECT 'main-course', 'Main Course', 'Primary course content', 'FolderOpen', '#f59e0b', s.id, 0
FROM subjects s
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE subject_id = s.id);

-- Link existing chapters to default folder
UPDATE chapters SET folder_id = (SELECT f.id FROM folders f WHERE f.slug = 'main-course')
WHERE folder_id IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_chapters_folder_id ON chapters(folder_id);
CREATE INDEX IF NOT EXISTS idx_lectures_topic_id ON lectures(topic_id);
CREATE INDEX IF NOT EXISTS idx_folders_subject_id ON folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);
