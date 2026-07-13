-- Seed lectures for each chapter
-- History (ancient-history) already has 'stone-age'

INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('e9a14ecc-58d8-46f3-a771-2fe3ae34cdf2', 'indus-valley-civilization', 'Indus Valley Civilization', 'Complete overview of the Indus Valley Civilization — cities, culture, and decline.', 2, 2, 2700, true, false, 'Parmar Sir', 'Beginner'),
('e9a14ecc-58d8-46f3-a771-2fe3ae34cdf2', 'vedic-period', 'Vedic Period', 'Early and Later Vedic Period, society, and religious practices.', 3, 3, 2400, false, true, 'Parmar Sir', 'Intermediate');

-- Polity
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('94c3c984-ade7-4fab-8382-cc4327adec90', 'preamble-and-fundamental-rights', 'Preamble & Fundamental Rights', 'Detailed explanation of the Preamble and Fundamental Rights in the Indian Constitution.', 1, 1, 3000, true, false, 'Parmar Sir', 'Beginner'),
('94c3c984-ade7-4fab-8382-cc4327adec90', 'dpsp-and-fundamental-duties', 'DPSP & Fundamental Duties', 'Directive Principles of State Policy and Fundamental Duties explained.', 2, 2, 2700, false, false, 'Parmar Sir', 'Intermediate');

-- Economics
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('6a59f90e-ba93-4d8b-beca-fe0d82dbf1cf', 'banking-system', 'Banking System in India', 'RBI, commercial banks, monetary policy, and banking reforms.', 1, 1, 3300, true, false, 'Parmar Sir', 'Intermediate'),
('6a59f90e-ba93-4d8b-beca-fe0d82dbf1cf', 'budget-and-fiscal-policy', 'Budget & Fiscal Policy', 'Union Budget, fiscal deficit, and government revenue.', 2, 2, 2700, false, true, 'Parmar Sir', 'Intermediate');

-- Geography
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('925e28ed-d349-4a6b-9ecf-41cd4f62c286', 'rivers-of-india', 'Rivers of India', 'Major river systems of India — Ganga, Brahmaputra, Indus, and peninsular rivers.', 1, 1, 3000, true, false, 'Parmar Sir', 'Beginner'),
('925e28ed-d349-4a6b-9ecf-41cd4f62c286', 'mountain-passes', 'Mountain Passes & Ranges', 'Himalayan ranges, important passes, and their significance.', 2, 2, 2400, false, false, 'Parmar Sir', 'Beginner');

-- Science
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('498d490f-321d-448e-9efb-5a08d5849e80', 'physics-basics', 'Physics Basics', 'Motion, force, energy, and key physics concepts for competitive exams.', 1, 1, 2700, true, false, 'Parmar Sir', 'Beginner'),
('498d490f-321d-448e-9efb-5a08d5849e80', 'chemistry-in-everyday-life', 'Chemistry in Everyday Life', 'Important chemical reactions, acids, bases, and practical chemistry.', 2, 2, 2400, false, true, 'Parmar Sir', 'Beginner');

-- Static GK
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('35b78a8b-4d2a-4de8-9d15-1d4b83461a56', 'famous-books-and-authors', 'Famous Books & Authors', 'Important books and their authors for SSC and Railway exams.', 1, 1, 1800, true, false, 'Parmar Sir', 'Beginner'),
('35b78a8b-4d2a-4de8-9d15-1d4b83461a56', 'national-awards', 'National Awards & Honors', 'Bharat Ratna, Padma Awards, and other national honors.', 2, 2, 1500, false, false, 'Parmar Sir', 'Beginner');

-- Current Affairs
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('b98c185f-5457-4640-8148-174552fa8f33', 'government-schemes-2024', 'Government Schemes 2024', 'Latest central government schemes and their benefits.', 1, 1, 2700, true, true, 'Parmar Sir', 'Intermediate'),
('b98c185f-5457-4640-8148-174552fa8f33', 'international-relations', 'International Relations', 'India''s foreign policy and key international relationships.', 2, 2, 2400, false, false, 'Parmar Sir', 'Intermediate');

-- Miscellaneous
INSERT INTO lectures (chapter_id, slug, title, description, sort_order, lecture_number, duration_seconds, is_pinned, is_new, teacher_name, difficulty)
VALUES
('6a0f82c6-af06-4308-939e-327366c45a44', 'logical-reasoning-basics', 'Logical Reasoning Basics', 'Series, analogies, coding-decoding fundamentals.', 1, 1, 2700, true, false, 'Parmar Sir', 'Beginner'),
('6a0f82c6-af06-4308-939e-327366c45a44', 'blood-relations', 'Blood Relations', 'Solving blood relation problems for competitive exams.', 2, 2, 1800, false, true, 'Parmar Sir', 'Beginner');
