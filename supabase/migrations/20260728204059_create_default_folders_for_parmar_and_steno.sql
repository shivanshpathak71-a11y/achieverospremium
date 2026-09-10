/*
# Create default folders for Parmar and Pitman batches
# Links their existing chapters to default folders
*/

-- Create default folder for Parmar Maths Foundation
INSERT INTO folders (slug, title, description, icon, color, subject_id, sort_order)
SELECT 'parmar-main-course', 'Main Course', 'Primary course content', 'FolderOpen', '#f59e0b', s.id, 0
FROM subjects s
WHERE s.slug = 'parmar-maths-foundation'
AND NOT EXISTS (SELECT 1 FROM folders WHERE subject_id = s.id);

-- Link Parmar chapters to default folder
UPDATE chapters SET folder_id = (SELECT f.id FROM folders f WHERE f.slug = 'parmar-main-course')
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'parmar-maths-foundation')
AND folder_id IS NULL;

-- Create default folder for Steno Pitman Blueprint
INSERT INTO folders (slug, title, description, icon, color, subject_id, sort_order)
SELECT 'steno-main-course', 'Main Course', 'Primary course content', 'FolderOpen', '#f59e0b', s.id, 0
FROM subjects s
WHERE s.slug = 'steno-pitman-blueprint'
AND NOT EXISTS (SELECT 1 FROM folders WHERE subject_id = s.id);

-- Link Steno chapters to default folder
UPDATE chapters SET folder_id = (SELECT f.id FROM folders f WHERE f.slug = 'steno-main-course')
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'steno-pitman-blueprint')
AND folder_id IS NULL;
