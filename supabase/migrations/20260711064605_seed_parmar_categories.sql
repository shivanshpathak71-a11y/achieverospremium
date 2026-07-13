-- Replace old English subjects with Parmar 4.0 GS exam categories
-- First, remove old subjects (cascade will remove chapters and lectures)
DELETE FROM subjects WHERE slug IN ('english-grammar', 'vocabulary', 'reading-comprehension');

-- Insert new categories
INSERT INTO subjects (slug, title, description, icon, color, gradient, sort_order) VALUES
('history',          'History',          'Ancient, Medieval & Modern Indian History', 'Landmark',    '#dc2626', 'from-red-600 to-orange-500',     1),
('polity',           'Polity',           'Indian Constitution & Governance',          'Scale',       '#3B82F6', 'from-blue-600 to-cyan-500',      2),
('economics',        'Economics',        'Indian Economy & Economic Systems',         'TrendingUp',  '#10B981', 'from-emerald-600 to-teal-500',   3),
('geography',        'Geography',        'Physical & Indian Geography',                'Map',         '#f59e0b', 'from-amber-500 to-yellow-500',   4),
('science',          'Science',          'General Science & Technology',               'FlaskConical','#7C3AED', 'from-purple-600 to-fuchsia-500', 5),
('static-gk',        'Static GK',        'Static General Knowledge',                   'Building2',   '#06b6d4', 'from-cyan-600 to-blue-500',      6),
('current-affairs',  'Current Affairs',  'Latest Current Affairs & News',             'Newspaper',   '#10B981', 'from-green-600 to-emerald-500',   7),
('miscellaneous',    'Miscellaneous',     'Other GS Topics & Practice',                'FolderTree',  '#64748b', 'from-slate-600 to-gray-500',     8);
