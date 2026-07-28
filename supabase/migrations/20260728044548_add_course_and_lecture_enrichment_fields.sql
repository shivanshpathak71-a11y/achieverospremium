/*
# Add course-level and lecture-level enrichment fields

1. Purpose
   The source API (selectionway) provides course-level metadata (timetable, FAQs,
   faculty details, highlights, validity, pricing, banner images) and lecture-level
   data (class tests with series IDs, PDF file names) that are not currently synced
   or displayed. This migration adds the columns needed to store all of it so the
   website can show 100% of what the source provides.

2. subjects table — new columns
   - banner_url (text) — wide banner image for the course
   - banner_square_url (text) — square banner image for the course
   - validity (text) — course validity period (e.g. "2 years")
   - price (numeric) — original price
   - discount_price (numeric) — discounted price
   - live_classes_count (integer) — number of live classes
   - recorded_classes_count (integer) — number of recorded classes
   - student_count (integer) — enrolled student count
   - time_table (jsonb) — array of {topic, time} schedule entries
   - faqs (jsonb) — array of {question, answer} FAQ entries
   - faculty_details (jsonb) — faculty info object {name, designation, bio, imageUrl, experience, reach, description, socialLinks, videoUrl}
   - course_highlights (jsonb) — array of highlight strings
   - intro_video_id (text) — intro video identifier
   - main_category (text) — main category name (e.g. "SSC")

3. lectures table — new columns
   - class_tests (jsonb) — array of {name, seriesId, maxAttemptedLimit} test objects
   - pdf_names (jsonb) — array of {name, url} PDF objects with human-readable names

4. Security
   No new tables. No RLS policy changes — existing anon+authenticated policies
   already cover these columns since they are on existing tables.
*/

-- subjects enrichment
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS banner_square_url text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS validity text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS price numeric;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS discount_price numeric;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS live_classes_count integer;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS recorded_classes_count integer;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS student_count integer;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS time_table jsonb;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS faqs jsonb;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS faculty_details jsonb;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS course_highlights jsonb;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS intro_video_id text;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS main_category text;

-- lectures enrichment
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS class_tests jsonb;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS pdf_names jsonb;
