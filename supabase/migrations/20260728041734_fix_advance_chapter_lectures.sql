/*
# Fix ADVANCE chapter lectures — move misplaced lectures and fix sort_order

1. Problem
- The "ADVANCE" topic (2D Mensuration, 23 classes) and "Advance" topic (Geometry, 16 classes) 
  were previously merged into one chapter due to slug collision
- The sync now creates separate chapters keyed by source_topic_id
- But the 23 ADVANCE lectures are still in the "Advance" chapter with wrong sort_order

2. Fix
- Move all 23 ADVANCE lectures to the ADVANCE chapter (source_topic_id = '69afef26a2b1ae0433b3d44b')
- Re-number sort_order for both chapters to match source order

3. Notes
- Uses source_class_id to identify which lectures belong to which topic
- No data loss — only chapter_id and sort_order are updated
*/

-- Get the ADVANCE chapter ID
DO $$
DECLARE
  advance_chapter_uuid uuid;
  advance_topic_id text := '69afef26a2b1ae0433b3d44b';
BEGIN
  SELECT id INTO advance_chapter_uuid FROM chapters WHERE source_topic_id = advance_topic_id;
  IF advance_chapter_uuid IS NULL THEN
    RAISE NOTICE 'ADVANCE chapter not found, skipping';
    RETURN;
  END IF;

  -- Move ADVANCE lectures to the ADVANCE chapter
  UPDATE lectures
  SET chapter_id = advance_chapter_uuid
  WHERE source_class_id IN (
    '69ae9f23a2b1ae04337d0f76','69aea316a2b1ae04337df93f','69aea33fa2b1ae04337e454f',
    '69aea35ea2b1ae04337e9162','69aea37ea2b1ae04337edd6e','69aea39fa2b1ae04337f297d',
    '69aea3bea2b1ae04337f758c','69aea3dca2b1ae04337fc1b8','69aea40ba2b1ae0433800dc5',
    '69aea433a2b1ae04338059d5','69aea453a2b1ae043380a5e4','69aea48ca2b1ae0433811821',
    '69aea4e3a2b1ae043381645f','69b2aa719d14466cd0bb8550','69b2aa989d14466cd0bbacf5',
    '69b2aabe9d14466cd0bbd4b6','69b2aadc9d14466cd0bbfc5a','69b2aaf19d14466cd0bc23fc',
    '69b2ab0d9d14466cd0bc4ba3','69bb8c432086ac9f00c52dc8','69bb93ae2086ac9f00c7c348',
    '69bb94142086ac9f00c8158c','69bb94502086ac9f00c86797'
  );

  -- Re-number sort_order for ADVANCE chapter lectures (by source_added_at)
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY source_added_at) - 1 as new_order
    FROM lectures
    WHERE chapter_id = advance_chapter_uuid
  )
  UPDATE lectures l
  SET sort_order = o.new_order
  FROM ordered o
  WHERE l.id = o.id;

  -- Re-number sort_order for Advance chapter (Geometry) lectures
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY source_added_at) - 1 as new_order
    FROM lectures
    WHERE chapter_id = (SELECT id FROM chapters WHERE source_topic_id = '68d7afa61ccb525c5c92cfa4')
  )
  UPDATE lectures l
  SET sort_order = o.new_order
  FROM ordered o
  WHERE l.id = o.id;
END $$;
