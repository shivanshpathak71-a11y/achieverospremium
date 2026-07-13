/*
# Add teacher_name and bookmarked columns

1. Changes
   - `lectures` table: add `teacher_name` (text, nullable) — the instructor who
     recorded the lecture. Displayed below the player alongside the lecture title.
   - `progress` table: add `bookmarked` (boolean, default false) — lets a learner
     bookmark a lecture for quick access later.

2. Security
   - No policy changes needed — existing anon+authenticated CRUD policies on both
     tables already cover the new columns.

3. Notes
   - Both additions are additive (ALTER TABLE ADD COLUMN) — no data is lost.
   - `teacher_name` is nullable so existing lectures remain valid without a backfill.
   - `bookmarked` defaults to false so existing progress rows are unaffected.
*/

ALTER TABLE lectures ADD COLUMN IF NOT EXISTS teacher_name text;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS bookmarked boolean NOT NULL DEFAULT false;
