import { motion } from 'framer-motion';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubjects, useAllChapters } from '../lib/hooks';
import * as LucideIcons from 'lucide-react';

function getIcon(name: string | null): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

export function HomePage() {
  const { navigate } = useRouter();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { chapters, loading: chaptersLoading } = useAllChapters();

  if (subjectsLoading || chaptersLoading) return <HomeSkeleton />;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <motion.div className="mb-8 mt-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-1">Select Chapter</h1>
        <p className="text-sm text-gray-500">Choose a subject to start learning</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((subject, i) => {
          const Icon = getIcon(subject.icon);
          const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
          return (
            <motion.button
              key={subject.id}
              onClick={() => navigate({ name: 'course', slug: subject.slug })}
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 text-left overflow-hidden hover:shadow-lg hover:border-pink-200 transition-all duration-300"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 1.03 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${(subject.color || '#ec4899')}10, transparent 70%)` }} />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${subject.color || '#ec4899'}15` }}>
                <Icon className="w-7 h-7" style={{ color: subject.color || '#ec4899' }} />
              </div>
              <h3 className="relative font-bold text-base text-gray-900 mb-1 group-hover:text-pink-600 transition-colors">{subject.title}</h3>
              <div className="relative flex items-center gap-2 text-xs text-gray-400">
                <span>{subjectChapters.length} chapters</span>
              </div>
              <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <div className="mb-8 mt-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse mb-4" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
