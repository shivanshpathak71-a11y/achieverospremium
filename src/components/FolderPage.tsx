import { motion } from 'framer-motion';
import { ChevronRight, FolderOpen, BookOpen, Clock, Layers } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubject, useFoldersBySubject, useChaptersByFolder, useAllLectures, formatDuration } from '../lib/hooks';
import { getCourseProgress } from '../lib/storage';
import { Breadcrumbs } from './Breadcrumbs';

export function FolderPage({ subjectSlug, folderSlug }: { subjectSlug: string; folderSlug: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subjectLoading } = useSubject(subjectSlug);
  const { folders, loading: foldersLoading } = useFoldersBySubject(subject?.id);
  const { chapters, loading: chaptersLoading } = useChaptersByFolder(
    folders.find((f) => f.slug === folderSlug)?.id
  );
  const { lectures } = useAllLectures();

  if (subjectLoading || foldersLoading || chaptersLoading) return <FolderSkeleton />;

  const folder = folders.find((f) => f.slug === folderSlug);
  if (!folder) {
    return <div className="pt-20 px-4 text-center text-gray-400">Folder not found.</div>;
  }

  return (
    <div className="pt-16 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <Breadcrumbs items={[
        { label: subject?.title || 'Subject', route: { name: 'course', slug: subjectSlug } },
        { label: folder.title },
      ]} />

      <motion.div
        className="bg-white border border-gray-200 rounded-3xl p-6 mb-6 mt-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${folder.color || '#f59e0b'}15` }}
          >
            <FolderOpen className="w-7 h-7" style={{ color: folder.color || '#f59e0b' }} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">{folder.title}</h1>
            {folder.description && <p className="text-sm text-gray-500 mt-0.5">{folder.description}</p>}
            <p className="text-xs text-gray-400 mt-1">{chapters.length} chapters</p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        {chapters.map((chapter, i) => {
          const chapterLectures = lectures.filter((l) => l.chapter_id === chapter.id);
          const chapterLectureIds = chapterLectures.map((l) => l.id);
          const progress = chapterLectureIds.length > 0 ? getCourseProgress(chapterLectureIds) : 0;
          const totalDuration = chapterLectures.reduce((sum, l) => sum + (l.duration_seconds || 0), 0);

          return (
            <motion.button
              key={chapter.id}
              onClick={() => navigate({ name: 'chapter', subjectSlug, chapterSlug: chapter.slug })}
              className="group w-full bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 group-hover:text-primary-600 transition-colors">
                    {chapter.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {chapterLectures.length} lectures
                    </span>
                    {totalDuration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(totalDuration)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {progress > 0 && (
                    <span className="text-xs font-semibold text-primary-500">{progress}%</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
              {progress > 0 && (
                <div className="h-1.5 rounded-full bg-gray-100 mt-3 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function FolderSkeleton() {
  return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4">
      <div className="skeleton rounded-3xl p-6 h-24 mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rounded-2xl p-5 h-20" />
        ))}
      </div>
    </div>
  );
}
