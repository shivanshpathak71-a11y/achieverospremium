-- Seed chapters for each subject (using known subject IDs)
-- History already has 'ancient-history' chapter

-- Polity
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('1692e52e-1d69-42d8-878c-91460a2c9537', 'indian-constitution', 'Indian Constitution', 'Fundamental Rights, DPSP, and the Preamble', 1, 1);

-- Economics
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('a56bf36f-e0a2-4b30-b633-c8231b36ee9b', 'indian-economy', 'Indian Economy', 'Banking, Budget, and Economic Systems', 1, 1);

-- Geography
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('2f05ab3a-ba7d-4780-9b09-feaeb4e35c98', 'physical-geography', 'Physical Geography', 'Rivers, Mountains, and Climate of India', 1, 1);

-- Science
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('d6899996-c1da-46d7-a295-05db04082a0e', 'general-science', 'General Science', 'Physics, Chemistry, and Biology basics', 1, 1);

-- Static GK
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('bf8abefd-70ee-4e64-9091-2bdb257423f1', 'books-and-authors', 'Books & Authors', 'Famous books, authors, and awards', 1, 1);

-- Current Affairs
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('e558369f-e420-4f05-b5ae-b83837b6b6f3', 'national-affairs', 'National Affairs', 'Latest national news and government schemes', 1, 1);

-- Miscellaneous
INSERT INTO chapters (subject_id, slug, title, description, sort_order, chapter_number)
VALUES ('b0cffb23-10db-4635-b5ba-526d0791ebea', 'reasoning', 'Reasoning', 'Logical reasoning and practice questions', 1, 1);
