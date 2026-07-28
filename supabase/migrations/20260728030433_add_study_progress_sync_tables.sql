/*
# Add study progress & stats sync tables

1. New Tables
- `study_progress` — per-lecture watch progress (position, duration, completed) synced across devices.
  - `id` uuid PK
  - `user_id` uuid NOT NULL DEFAULT auth.uid() — owner
  - `lecture_id` uuid NOT NULL — which lecture
  - `position` double precision default 0 — seconds watched
  - `duration` double precision default 0 — lecture duration
  - `completed` boolean default false
  - `updated_at` timestamptz default now()
  - UNIQUE (user_id, lecture_id)
- `study_stats` — daily study-time log synced across devices.
  - `id` uuid PK
  - `user_id` uuid NOT NULL DEFAULT auth.uid() — owner
  - `study_date` date NOT NULL — the day
  - `seconds` integer default 0 — seconds studied that day
  - `updated_at` timestamptz default now()
  - UNIQUE (user_id, study_date)

2. Security
- Enable RLS on both tables.
- Owner-scoped CRUD on both: authenticated users can only read/insert/update/delete their own rows.
- user_id defaults to auth.uid() so inserts that omit it still pass the WITH CHECK.

3. Notes
- No foreign keys to lectures table (lecture_id is a free uuid — allows progress even if lecture row is deleted).
- study_stats uses a date column (not timestamp) so each day is one row per user.
*/

CREATE TABLE IF NOT EXISTS study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id uuid NOT NULL,
  position double precision NOT NULL DEFAULT 0,
  duration double precision NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lecture_id)
);

ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON study_progress;
CREATE POLICY "select_own_progress" ON study_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON study_progress;
CREATE POLICY "insert_own_progress" ON study_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON study_progress;
CREATE POLICY "update_own_progress" ON study_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON study_progress;
CREATE POLICY "delete_own_progress" ON study_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_progress_user ON study_progress(user_id);

CREATE TABLE IF NOT EXISTS study_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  study_date date NOT NULL,
  seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, study_date)
);

ALTER TABLE study_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_stats" ON study_stats;
CREATE POLICY "select_own_stats" ON study_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stats" ON study_stats;
CREATE POLICY "insert_own_stats" ON study_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stats" ON study_stats;
CREATE POLICY "update_own_stats" ON study_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stats" ON study_stats;
CREATE POLICY "delete_own_stats" ON study_stats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_stats_user ON study_stats(user_id);
