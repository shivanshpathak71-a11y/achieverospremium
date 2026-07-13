-- Storage RLS policies for lecture-videos bucket
-- Allows anon + authenticated to upload/read/delete videos (no sign-in app).

DROP POLICY IF EXISTS "lecture_videos_select" ON storage.objects;
CREATE POLICY "lecture_videos_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'lecture-videos');

DROP POLICY IF EXISTS "lecture_videos_insert" ON storage.objects;
CREATE POLICY "lecture_videos_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'lecture-videos');

DROP POLICY IF EXISTS "lecture_videos_update" ON storage.objects;
CREATE POLICY "lecture_videos_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'lecture-videos');

DROP POLICY IF EXISTS "lecture_videos_delete" ON storage.objects;
CREATE POLICY "lecture_videos_delete" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'lecture-videos');
