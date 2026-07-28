/*
# Add source-sync tracking columns

1. Changes
- subjects: add `source_batch_id` text — the external batch ID from selectionway.edgeone.app
- chapters: add `source_topic_id` text — the external topic ID from the source API
- lectures: add `source_class_id` text — the external class ID from the source API
- lectures: add `source_added_at` timestamptz — when the class was added on the source

2. Purpose
- Lets the auto-sync edge function match existing rows to source data and upsert without duplicates.
- source_batch_id on subjects identifies which subject is the synced "Selection Batch".
- source_class_id is unique on lectures (partial — nulls allowed for manually-created lectures).

3. Security
- No policy changes. Existing RLS policies cover the new columns.
*/

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS source_batch_id text;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS source_topic_id text;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_class_id text;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_added_at timestamptz;

-- Unique index on source_class_id where it's not null (prevents duplicate syncs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lectures_source_class_id
  ON lectures(source_class_id) WHERE source_class_id IS NOT NULL;
