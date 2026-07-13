-- Study streaks table
CREATE TABLE IF NOT EXISTS study_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_study_date date,
  total_study_seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_streak" ON study_streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "upsert_own_streak" ON study_streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_streak" ON study_streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily goals table
CREATE TABLE IF NOT EXISTS daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_date date NOT NULL DEFAULT CURRENT_DATE,
  target_minutes integer NOT NULL DEFAULT 30,
  achieved_minutes integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, goal_date)
);

ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_goals" ON daily_goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_goals" ON daily_goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_goals" ON daily_goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lecture_id uuid REFERENCES lectures(id) ON DELETE SET NULL,
  certificate_title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_certs" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_certs" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_announcement_admin" ON announcements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "update_announcement_admin" ON announcements FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "delete_announcement_admin" ON announcements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_banners" ON banners FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_banner_admin" ON banners FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "update_banner_admin" ON banners FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );
CREATE POLICY "delete_banner_admin" ON banners FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = auth.uid())
  );

-- Add publish scheduling to lectures
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS published_at timestamptz;
