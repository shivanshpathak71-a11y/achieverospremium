/*
# Lock down database: anon read-only, admin write

1. Security changes on `subjects`:
- SELECT: anon + authenticated (read-only for visitors)
- INSERT/UPDATE/DELETE: authenticated admins only (checked via admin_users table)

2. Security changes on `chapters`:
- Same pattern as subjects

3. Security changes on `lectures`:
- Same pattern as subjects

4. Security changes on `announcements`:
- Same pattern as subjects

5. Security changes on `banners`:
- Same pattern as subjects

6. Security changes on `admin_users`:
- SELECT: authenticated users can read their own row
- INSERT/DELETE: authenticated admins only

7. Important notes:
- Visitors (anon) can browse all content but cannot modify anything
- Only authenticated users listed in admin_users with role='admin' can create/edit/delete
- The app requires sign-in to access the admin panel
*/

-- ─── subjects ───
DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_subjects" ON subjects;
CREATE POLICY "admin_insert_subjects" ON subjects FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_update_subjects" ON subjects;
CREATE POLICY "admin_update_subjects" ON subjects FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_subjects" ON subjects;
CREATE POLICY "admin_delete_subjects" ON subjects FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── chapters ───
DROP POLICY IF EXISTS "anon_select_chapters" ON chapters;
CREATE POLICY "anon_select_chapters" ON chapters FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_chapters" ON chapters;
CREATE POLICY "admin_insert_chapters" ON chapters FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_update_chapters" ON chapters;
CREATE POLICY "admin_update_chapters" ON chapters FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_chapters" ON chapters;
CREATE POLICY "admin_delete_chapters" ON chapters FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── lectures ───
DROP POLICY IF EXISTS "anon_select_lectures" ON lectures;
CREATE POLICY "anon_select_lectures" ON lectures FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_lectures" ON lectures;
CREATE POLICY "admin_insert_lectures" ON lectures FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_update_lectures" ON lectures;
CREATE POLICY "admin_update_lectures" ON lectures FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_lectures" ON lectures;
CREATE POLICY "admin_delete_lectures" ON lectures FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── announcements ───
DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
CREATE POLICY "anon_select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_announcements" ON announcements;
CREATE POLICY "admin_insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_update_announcements" ON announcements;
CREATE POLICY "admin_update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_announcements" ON announcements;
CREATE POLICY "admin_delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── banners ───
DROP POLICY IF EXISTS "anon_select_banners" ON banners;
CREATE POLICY "anon_select_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_banners" ON banners;
CREATE POLICY "admin_insert_banners" ON banners FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_update_banners" ON banners;
CREATE POLICY "admin_update_banners" ON banners FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_banners" ON banners;
CREATE POLICY "admin_delete_banners" ON banners FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'admin'));

-- ─── admin_users ───
DROP POLICY IF EXISTS "self_select_admin_users" ON admin_users;
CREATE POLICY "self_select_admin_users" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_insert_admin_users" ON admin_users;
CREATE POLICY "admin_insert_admin_users" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_admin_users" ON admin_users;
CREATE POLICY "admin_delete_admin_users" ON admin_users FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role = 'admin'));
