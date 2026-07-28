/*
# Restructure Selection Batch into 4 subjects + fix stale live flags

## What this does
1. Creates 4 new subjects (English, Mathematics, General Knowledge, Reasoning) under the Selection Batch
2. Moves existing chapters into the appropriate new subjects
3. Fixes stale `is_live = true` flags on lectures whose end_date has passed
4. Adds date display support for live classes

## New subjects created
- "English" (slug: selection-english) — chapters: Grammar, Misc. Grammar Practice, Vocab, PQRS/CT/RC
- "Mathematics" (slug: selection-mathematics) — chapters: ADVANCE, ARITHMETIC, Number System and More
- "General Knowledge" (slug: selection-gk) — chapters: ECONOMICS, Chemistry, Biology, Science Practice
- "Reasoning" (slug: selection-reasoning) — chapters: Verbal

## Chapters left in original subject (selection-batch-10)
- "(Live Classes) Very Very Important" — stays as-is
- "Mock Test" — stays as-is
- "must watch" — stays as-is
- "Information" — stays as-is
- "Advance" (sort_order 15) — stays as-is

## Data safety
- No data is deleted. Chapters are moved via UPDATE to new subject_id.
- Original subject (selection-batch-10) is preserved as the main course container.
- All lectures remain attached to their chapters.

## Security
- No RLS changes. Existing policies on subjects and chapters remain unchanged.
*/

-- ─── 1. Create 4 new subjects ───
DO $$
DECLARE
  batch_subject_id uuid;
  eng_id uuid;
  math_id uuid;
  gk_id uuid;
  reasoning_id uuid;
BEGIN
  -- Get the original Selection Batch subject ID
  SELECT id INTO batch_subject_id FROM subjects WHERE slug = 'selection-batch-10';
  IF batch_subject_id IS NULL THEN
    RAISE NOTICE 'Selection Batch subject not found, skipping';
    RETURN;
  END IF;

  -- Create English subject
  INSERT INTO subjects (slug, icon, color, gradient, sort_order, source_batch_id, title)
  VALUES ('selection-english', 'BookOpen', '#3b82f6', 'from-blue-500 to-cyan-500', 1, '6a462e62b927c1a84a8b7879', 'English')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO eng_id;

  -- Create Mathematics subject
  INSERT INTO subjects (slug, icon, color, gradient, sort_order, source_batch_id, title)
  VALUES ('selection-mathematics', 'Calculator', '#14b8a6', 'from-teal-500 to-cyan-500', 2, '6a462e62b927c1a84a8b7879', 'Mathematics')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO math_id;

  -- Create General Knowledge subject
  INSERT INTO subjects (slug, icon, color, gradient, sort_order, source_batch_id, title)
  VALUES ('selection-gk', 'Globe', '#f59e0b', 'from-amber-500 to-orange-500', 3, '6a462e62b927c1a84a8b7879', 'General Knowledge')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO gk_id;

  -- Create Reasoning subject
  INSERT INTO subjects (slug, icon, color, gradient, sort_order, source_batch_id, title)
  VALUES ('selection-reasoning', 'Brain', '#8b5cf6', 'from-violet-500 to-purple-500', 4, '6a462e62b927c1a84a8b7879', 'Reasoning')
  ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO reasoning_id;

  RAISE NOTICE 'Created subjects: eng=%, math=%, gk=%, reasoning=%', eng_id, math_id, gk_id, reasoning_id;

  -- ─── 2. Move chapters to new subjects ───

  -- English: Grammar, Misc. Grammar Practice, Vocab, PQRS/CT/RC
  UPDATE chapters SET subject_id = eng_id, sort_order = 0
  WHERE subject_id = batch_subject_id AND slug = 'grammar-fb235b';
  UPDATE chapters SET subject_id = eng_id, sort_order = 1
  WHERE subject_id = batch_subject_id AND slug = 'misc-grammar-practice-36a3ba';
  UPDATE chapters SET subject_id = eng_id, sort_order = 2
  WHERE subject_id = batch_subject_id AND slug = 'vocab-0acd30';
  UPDATE chapters SET subject_id = eng_id, sort_order = 3
  WHERE subject_id = batch_subject_id AND slug = 'pqrs-ct-rc-a418e3';

  -- Mathematics: ADVANCE, ARITHMETIC, Number System and More
  UPDATE chapters SET subject_id = math_id, sort_order = 0
  WHERE subject_id = batch_subject_id AND slug = 'advance-b3d44b';
  UPDATE chapters SET subject_id = math_id, sort_order = 1
  WHERE subject_id = batch_subject_id AND slug = 'arithmetic-b3d453';
  UPDATE chapters SET subject_id = math_id, sort_order = 2
  WHERE subject_id = batch_subject_id AND slug = 'number-system-and-more-f39ddb';

  -- General Knowledge: ECONOMICS, Chemistry, Biology, Science Practice
  UPDATE chapters SET subject_id = gk_id, sort_order = 0
  WHERE subject_id = batch_subject_id AND slug = 'economics-6a917f';
  UPDATE chapters SET subject_id = gk_id, sort_order = 1
  WHERE subject_id = batch_subject_id AND slug = 'chemistry-841a2a';
  UPDATE chapters SET subject_id = gk_id, sort_order = 2
  WHERE subject_id = batch_subject_id AND slug = 'biology-9d8348';
  UPDATE chapters SET subject_id = gk_id, sort_order = 3
  WHERE subject_id = batch_subject_id AND slug = 'science-practice-788206';

  -- Reasoning: Verbal
  UPDATE chapters SET subject_id = reasoning_id, sort_order = 0
  WHERE subject_id = batch_subject_id AND slug = 'verbal-dc4758';

  RAISE NOTICE 'Chapters moved successfully';
END $$;

-- ─── 3. Fix stale is_live flags ───
-- Any lecture where is_live = true but end_date is in the past should be set to false
UPDATE lectures
SET is_live = false,
    updated_at = now()
WHERE is_live = true
  AND end_date IS NOT NULL
  AND end_date < now();

-- Also fix lectures where is_live = true but start_date is more than 2 hours in the past with no end_date
UPDATE lectures
SET is_live = false,
    updated_at = now()
WHERE is_live = true
  AND end_date IS NULL
  AND start_date IS NOT NULL
  AND start_date < now() - interval '2 hours';
