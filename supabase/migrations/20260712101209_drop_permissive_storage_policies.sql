-- Drop the old permissive storage policies that allowed anyone to write
DROP POLICY IF EXISTS "lecture_videos_insert" ON storage.objects;
DROP POLICY IF EXISTS "lecture_videos_update" ON storage.objects;
DROP POLICY IF EXISTS "lecture_videos_delete" ON storage.objects;
DROP POLICY IF EXISTS "lecture_videos_select" ON storage.objects;
