-- Add source_batch_id to lectures so we can filter by batch
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_batch_id text;

-- Backfill existing lectures from their subject's source_batch_id
UPDATE lectures l
SET source_batch_id = s.source_batch_id
FROM chapters c
JOIN subjects s ON s.id = c.subject_id
WHERE c.id = l.chapter_id
  AND l.source_batch_id IS NULL;
