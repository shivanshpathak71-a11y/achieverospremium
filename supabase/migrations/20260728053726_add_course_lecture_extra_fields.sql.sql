/*
# Add extra course and lecture enrichment fields

1. New columns on `subjects`:
- `short_description` (text) — one-line summary from source API
- `is_free` (boolean, default false) — whether the course is free
- `is_recorded` (boolean, default false) — whether the course is recorded-only
- `demo_video_url` (text) — URL for a demo/intro video

2. New columns on `lectures`:
- `unique_view_count` (integer, default 0) — view count from source
- `is_free` (boolean, default false) — whether the lecture is free/preview
- `is_blinking` (boolean, default false) — attention indicator from source
- `start_date` (timestamptz) — scheduled start date for live classes
- `end_date` (timestamptz) — scheduled end date
- `section_name` (text) — section grouping name

3. Security: no new tables, no RLS changes. All new columns are nullable with safe defaults.
*/

ALTER TABLE subjects
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_recorded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_video_url text;

ALTER TABLE lectures
  ADD COLUMN IF NOT EXISTS unique_view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blinking boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS section_name text;
