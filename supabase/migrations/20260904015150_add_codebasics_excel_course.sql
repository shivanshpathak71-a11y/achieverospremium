/*
# Add Codebasics Excel Course (codebasics.io)

1. Schema Changes
   - Add `source_lecture_url` column to `lectures` table (text, nullable) — stores the
     original lecture page URL (e.g. https://codebasics.io/courses/bootcamp/1/...lecture/1131).
     Used by the video-embed edge function to scrape Gumlet iframe tokens at play time.

2. New Data
   - Insert a "Codebasics" teacher record.
   - Insert a "Excel: Mother of Business Intelligence" subject linked to that teacher.
   - The sync-codebasics-excel edge function will populate chapters and lectures.

3. Security
   - No RLS policy changes — the new column inherits the existing lectures table policies.
*/

-- Add source_lecture_url column to lectures
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_lecture_url text;

-- Insert Codebasics teacher (idempotent)
INSERT INTO teachers (slug, name, designation, bio, image_url, sort_order)
VALUES (
  'codebasics',
  'Codebasics',
  'Data Analytics & Business Intelligence',
  'Codebasics offers practical, project-based courses on data analytics, Excel, SQL, Python, and business intelligence tools.',
  NULL,
  50
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  designation = EXCLUDED.designation,
  bio = EXCLUDED.bio,
  updated_at = now();

-- Insert the Excel subject (idempotent via source_batch_id)
INSERT INTO subjects (
  slug,
  title,
  description,
  short_description,
  icon,
  color,
  gradient,
  sort_order,
  source_batch_id,
  teacher_id,
  is_free,
  is_recorded,
  main_category,
  banner_url,
  price,
  discount_price
)
SELECT
  'excel-mother-of-business-intelligence',
  'Excel: Mother of Business Intelligence',
  'Master Excel from basics to advanced business analytics. Learn Power Query, Pivot Tables, Power Pivot, DAX, and real-time business applications through a story-driven course.',
  'Master Excel from basics to advanced business analytics',
  'Table',
  'green',
  'from-green-500 to-emerald-500',
  110,
  'codebasics-excel-bootcamp-1',
  (SELECT id FROM teachers WHERE slug = 'codebasics'),
  false,
  true,
  'Data Analytics',
  NULL,
  NULL,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM subjects WHERE source_batch_id = 'codebasics-excel-bootcamp-1'
);

-- If subject already exists, ensure teacher_id is set
UPDATE subjects SET teacher_id = (SELECT id FROM teachers WHERE slug = 'codebasics')
WHERE source_batch_id = 'codebasics-excel-bootcamp-1' AND teacher_id IS NULL;
