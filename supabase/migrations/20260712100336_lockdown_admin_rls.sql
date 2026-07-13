-- Lock down subjects, chapters, lectures: keep SELECT public, restrict writes to admin users only.
-- Drop the wide-open anon policies that allowed anyone to insert/update/delete.

-- ─── subjects ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;

CREATE POLICY "insert_subjects_admin" ON subjects
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "update_subjects_admin" ON subjects
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "delete_subjects_admin" ON subjects
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

-- ─── chapters ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_delete_chapters" ON chapters;
DROP POLICY IF EXISTS "anon_insert_chapters" ON chapters;
DROP POLICY IF EXISTS "anon_update_chapters" ON chapters;

CREATE POLICY "insert_chapters_admin" ON chapters
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "update_chapters_admin" ON chapters
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "delete_chapters_admin" ON chapters
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

-- ─── lectures ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_delete_lectures" ON lectures;
DROP POLICY IF EXISTS "anon_insert_lectures" ON lectures;
DROP POLICY IF EXISTS "anon_update_lectures" ON lectures;

CREATE POLICY "insert_lectures_admin" ON lectures
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "update_lectures_admin" ON lectures
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "delete_lectures_admin" ON lectures
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

-- ─── Storage: restrict lecture-videos bucket to admin users ─────────────────
-- Allow authenticated admins to upload, anyone to read
CREATE POLICY "read_lecture_videos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'lecture-videos');

CREATE POLICY "write_lecture_videos_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lecture-videos' AND EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "update_lecture_videos_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'lecture-videos' AND EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (bucket_id = 'lecture-videos' AND EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "delete_lecture_videos_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'lecture-videos' AND EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid()));
