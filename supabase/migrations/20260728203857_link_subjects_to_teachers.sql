/*
# Link Parmar and Pitman subjects to teachers
- Add "P. Parmar Sir" as teacher for Parmar Maths Foundation
- Add a steno teacher for Pitman Blueprint
- Link all subjects to their respective teachers
*/

-- Add P. Parmar Sir teacher
INSERT INTO teachers (slug, name, designation, bio, sort_order)
VALUES ('parmar-sir', 'P. Parmar Sir', 'Maths Faculty', 'Expert maths educator at Parmar Academy specializing in SSC and competitive exam preparation.', 1)
ON CONFLICT (slug) DO NOTHING;

-- Add a steno teacher
INSERT INTO teachers (slug, name, designation, bio, sort_order)
VALUES ('steno-faculty', 'Steno Faculty', 'Stenography Expert', 'Expert stenography instructor specializing in Pitman shorthand from basic to advanced level.', 2)
ON CONFLICT (slug) DO NOTHING;

-- Link Parmar Maths Foundation to P. Parmar Sir
UPDATE subjects SET teacher_id = (SELECT id FROM teachers WHERE slug = 'parmar-sir')
WHERE slug = 'parmar-maths-foundation' AND teacher_id IS NULL;

-- Link Steno Pitman Blueprint to Steno Faculty
UPDATE subjects SET teacher_id = (SELECT id FROM teachers WHERE slug = 'steno-faculty')
WHERE slug = 'steno-pitman-blueprint' AND teacher_id IS NULL;

-- Rename Bhutesh Sir's designation to be more specific
UPDATE teachers SET designation = 'Lead Faculty (Selection Batch)' WHERE slug = 'bhutesh-sir';
