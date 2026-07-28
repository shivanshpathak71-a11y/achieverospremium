/*
# Add pdf_urls array and is_live columns to lectures

1. Modified Tables
- `lectures`
  - Add `pdf_urls` (jsonb, nullable) — stores ALL PDF URLs for a class (many classes have 2+ PDFs)
  - Add `is_live` (boolean, default false) — marks live class sessions (isLive=true from source)
  - Add `source_video_urls` (jsonb, nullable) — stores ALL video URLs (mp4 recordings + HLS class_link) for quality selection
2. Security
- No RLS policy changes — existing policies cover new columns automatically
3. Notes
- `pdf_url` (existing) stays as the primary/first PDF for backwards compatibility
- `pdf_urls` (new) stores the full array of all PDFs
- `video_url` (existing) stays as the best-quality MP4 or HLS URL
- `source_video_urls` (new) stores all available video URLs for future quality switching
*/

ALTER TABLE lectures ADD COLUMN IF NOT EXISTS pdf_urls jsonb;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS source_video_urls jsonb;
