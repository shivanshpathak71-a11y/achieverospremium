/*
# Add CodeWithHarry teacher and Data Science course subject

1. New Data
- Insert a new teacher "CodeWithHarry" into the teachers table.
- Insert a new subject "The Ultimate Job Ready Data Science Course" linked to that teacher,
  with course-level enrichment fields (price, discount, thumbnail, description, tags, etc.)
  and source_batch_id = "cwh-ds-cm97get6l0000dc0rats7r5kc" so the sync edge function can find it.
2. Security
- No new tables. Existing RLS policies on teachers/subjects apply.
3. Notes
- The teacher slug is "codewithharry".
- The subject slug is "the-ultimate-job-ready-data-science-course".
- sort_order is set high (100) so it appears after existing subjects.
*/

-- Insert teacher (idempotent via ON CONFLICT on slug)
INSERT INTO teachers (slug, name, bio, designation, sort_order)
VALUES (
  'codewithharry',
  'CodeWithHarry',
  'CodeWithHarry is a popular programming education platform with 7M+ students trained and 1B+ YouTube views. Courses cover Python, Data Science, Web Development, DSA, and more in an easy-to-follow Hindi style.',
  'Instructor & Content Creator',
  100
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  bio = EXCLUDED.bio,
  designation = EXCLUDED.designation,
  updated_at = now();

-- Get the teacher id
DO $$
DECLARE
  v_teacher_id uuid;
  v_subject_id uuid;
BEGIN
  SELECT id INTO v_teacher_id FROM teachers WHERE slug = 'codewithharry';

  -- Insert subject if not exists
  INSERT INTO subjects (
    slug, title, description, icon, color, gradient, sort_order,
    source_batch_id, banner_url, price, discount_price,
    is_free, is_recorded, teacher_id,
    short_description, main_category,
    course_highlights, faqs
  )
  VALUES (
    'the-ultimate-job-ready-data-science-course',
    'The Ultimate Job Ready Data Science Course',
    'This is a to-the-point, CodeWithHarry style Data Science course! This all-in-one Job-Ready Data Science Course is designed for beginners and intermediate learners who want to master data science skills and become industry-ready with hands-on experience.',
    'GraduationCap',
    'blue',
    'from-blue-500 to-cyan-500',
    100,
    'cwh-ds-cm97get6l0000dc0rats7r5kc',
    'https://codewithharry.nyc3.cdn.digitaloceanspaces.com/dashboard/course/the-ultimate-job-ready-data-science-course/1778310067125-ds-thumb.jpeg',
    4499,
    2899,
    false,
    true,
    v_teacher_id,
    'Master Python, data analysis, machine learning and artificial intelligence with hands-on projects.',
    'Data Science',
    jsonb_build_object(
      'tags', jsonb_build_array(
        'Data Science','Machine Learning','Data Visualization','Statistics for Data Science',
        'Pandas','NumPy','Data Science Projects','Data Analysis','Python'
      ),
      'whatYouWillLearn', jsonb_build_array(
        'Master Python programming from a data science perspective',
        'Perform powerful data analysis using Pandas and NumPy',
        'Create stunning data visualizations with Matplotlib and Seaborn',
        'Understand and apply core statistics and probability concepts',
        'Clean and preprocess real-world datasets for accurate insights',
        'Work on real-life projects',
        'Use Jupyter Notebooks for data-driven development',
        'Many Developer Tools like Quadratic AI (Free with this course)'
      ),
      'requirements', jsonb_build_array(
        'No prior experience in data science is needed',
        'Basic computer skills and internet access',
        'Willingness to learn and solve real-world problems',
        'Curiosity and consistency — that''s all you really need!',
        'Stable internet connection for accessing course content',
        'Basic familiarity with using the terminal/command line (helpful but not required)'
      ),
      'enrollmentCount', 49675,
      'language', 'Hindi',
      'level', 'Beginner',
      'instructor', 'CodeWithHarry',
      'promoLink', 'https://codewithharry.nyc3.cdn.digitaloceanspaces.com/dashboard/course/the-ultimate-job-ready-data-science-course/1744183029535-promo_data_science.mp4'
    ),
    null
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    banner_url = EXCLUDED.banner_url,
    price = EXCLUDED.price,
    discount_price = EXCLUDED.discount_price,
    is_recorded = EXCLUDED.is_recorded,
    teacher_id = EXCLUDED.teacher_id,
    short_description = EXCLUDED.short_description,
    main_category = EXCLUDED.main_category,
    course_highlights = EXCLUDED.course_highlights,
    updated_at = now();
END $$;
