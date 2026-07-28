/*
# Open admin tables to anon access (personal-use app, no sign-in)

## Context
This is a personal-use app with no public users. The admin panel should open
directly without any password or sign-in. The previous RLS policies required
an authenticated admin session, which broke the no-password admin flow.

## Changes
- subjects, chapters, lectures, announcements, banners:
  - Drop all existing admin-gated policies.
  - Create new policies allowing anon + authenticated full CRUD.
- admin_users table: no changes (no longer queried by the frontend).

## Security
This is acceptable because the app is for personal use only and not deployed
publicly. All tables are intentionally open for the anon-key client to manage.
*/

-- ── subjects ──────────────────────────────────────────────
DROP POLICY IF EXISTS "delete_subjects_admin" ON subjects;
DROP POLICY IF EXISTS "insert_subjects_admin" ON subjects;
DROP POLICY IF EXISTS "update_subjects_admin" ON subjects;
DROP POLICY IF EXISTS "anon_select_subjects"  ON subjects;

CREATE POLICY "anon_select_subjects"   ON subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_subjects"   ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_subjects"   ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_subjects"   ON subjects FOR DELETE TO anon, authenticated USING (true);

-- ── chapters ──────────────────────────────────────────────
DROP POLICY IF EXISTS "delete_chapters_admin" ON chapters;
DROP POLICY IF EXISTS "insert_chapters_admin" ON chapters;
DROP POLICY IF EXISTS "update_chapters_admin" ON chapters;
DROP POLICY IF EXISTS "anon_select_chapters"  ON chapters;

CREATE POLICY "anon_select_chapters"   ON chapters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_chapters"   ON chapters FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_chapters"   ON chapters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_chapters"   ON chapters FOR DELETE TO anon, authenticated USING (true);

-- ── lectures ──────────────────────────────────────────────
DROP POLICY IF EXISTS "delete_lectures_admin" ON lectures;
DROP POLICY IF EXISTS "insert_lectures_admin" ON lectures;
DROP POLICY IF EXISTS "update_lectures_admin" ON lectures;
DROP POLICY IF EXISTS "anon_select_lectures"  ON lectures;

CREATE POLICY "anon_select_lectures"   ON lectures FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_lectures"   ON lectures FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_lectures"   ON lectures FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_lectures"   ON lectures FOR DELETE TO anon, authenticated USING (true);

-- ── announcements ──────────────────────────────────────────
DROP POLICY IF EXISTS "delete_announcement_admin" ON announcements;
DROP POLICY IF EXISTS "insert_announcement_admin" ON announcements;
DROP POLICY IF EXISTS "update_announcement_admin" ON announcements;
DROP POLICY IF EXISTS "select_announcements"      ON announcements;

CREATE POLICY "anon_select_announcements"   ON announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_announcements"   ON announcements FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_announcements"   ON announcements FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_announcements"   ON announcements FOR DELETE TO anon, authenticated USING (true);

-- ── banners ───────────────────────────────────────────────
DROP POLICY IF EXISTS "delete_banner_admin" ON banners;
DROP POLICY IF EXISTS "insert_banner_admin" ON banners;
DROP POLICY IF EXISTS "update_banner_admin" ON banners;
DROP POLICY IF EXISTS "select_banners"      ON banners;

CREATE POLICY "anon_select_banners"   ON banners FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_banners"   ON banners FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_banners"   ON banners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_banners"   ON banners FOR DELETE TO anon, authenticated USING (true);
