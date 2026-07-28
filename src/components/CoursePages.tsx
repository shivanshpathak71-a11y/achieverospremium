import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Clock, FileText, Pin, BookOpen, CheckCircle, Calendar, Radio } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubjects, useSubject, useChaptersBySubjectSlug, useLectures, useAllLectures, useAllChapters, formatDuration } from '../lib/hooks';
import { getProgress, getCourseProgress, getAllProgress } from '../lib/storage';
import * as LucideIcons from 'lucide-react';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

function getIcon(name: string | null) {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

export function CourseListPage() {
  const { navigate } = useRouter();
  const { subjects, loading } = useSubjects();
  const { chapters } = useAllChapters();
  const { lectures } = useAllLectures();

  if (loading) return <div className="pt-20 pb-24 max-w-7xl mx-auto px-4"><div className="h-8 w-48 skeleton rounded-lg mb-4" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}</div></div>;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <motion.h1 className="font-bold text-2xl text-gray-900 mb-1 mt-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>All Courses</motion.h1>
      <motion.p className="text-sm text-gray-500 mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>Browse all subjects and chapters</motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s, i) => {
          const Icon = getIcon(s.icon);
          const subjectChapters = chapters.filter((c) => c.subject_id === s.id);
          const subjectLectureIds = lectures
            .filter((l) => subjectChapters.some((c) => c.id === l.chapter_id))
            .map((l) => l.id);
          const progress = subjectLectureIds.length > 0 ? getCourseProgress(subjectLectureIds) : 0;
          return (
            <motion.button key={s.id} onClick={() => navigate({ name: 'course', slug: s.slug })}
              className="group bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }} whileTap={{ scale: 1.02 }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${(s.color || '#14b8a6')}10, transparent 70%)` }} />
              <div className="relative flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110" style={{ background: `${s.color || '#14b8a6'}15` }}>
                  <Icon className="w-6 h-6" style={{ color: s.color || '#14b8a6' }} />
                </div>
                <div className="flex-1 min-w-0"><h3 className="font-bold text-gray-900 truncate">{s.title}</h3>{s.description && <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>}</div>
              </div>
              <div className="relative flex items-center gap-3 text-xs text-gray-400 mb-2">
                <span>{subjectChapters.length} chapters</span>
                <span>·</span>
                <span>{subjectLectureIds.length} lectures</span>
              </div>
              {progress > 0 && (
                <div className="relative">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1"><span>Progress</span><span className="text-primary-500 font-semibold">{progress}%</span></div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400" style={{ width: `${progress}%` }} /></div>
                </div>
              )}
              <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function CourseDetailPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subLoading } = useSubject(slug);
  const { chapters, loading: chLoading } = useChaptersBySubjectSlug(slug);
  const { lectures } = useAllLectures();

  if (subLoading || chLoading) return <div className="pt-20 max-w-4xl mx-auto px-4"><div className="h-8 w-48 skeleton rounded-lg mb-4" /><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div></div>;
  if (!subject) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Subject not found.</p></div>;

  const Icon = getIcon(subject.icon);
  const allProgress = getAllProgress();

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-4xl mx-auto px-4">
      <motion.button onClick={() => navigate({ name: 'courses' })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 mt-4 transition-colors"
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}><ChevronLeft className="w-4 h-4" /> Courses</motion.button>
      <motion.div className="flex items-center gap-4 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${subject.color || '#14b8a6'}15` }}><Icon className="w-8 h-8" style={{ color: subject.color || '#14b8a6' }} /></div>
        <div><h1 className="font-bold text-2xl text-gray-900">{subject.title}</h1>{subject.description && <p className="text-sm text-gray-500">{subject.description}</p>}</div>
      </motion.div>
      <div className="space-y-3">
        {chapters.map((ch, i) => {
          const chapterLectures = lectures.filter((l) => l.chapter_id === ch.id);
          const chapterLectureIds = chapterLectures.map((l) => l.id);
          const completedCount = chapterLectureIds.filter((id) => allProgress[id]?.completed).length;
          const totalCount = chapterLectureIds.length;
          const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const totalDuration = chapterLectures.reduce((sum, l) => sum + l.duration_seconds, 0);
          const watchedDuration = chapterLectures.reduce((sum, l) => {
            const prog = allProgress[l.id];
            return sum + (prog?.position || 0);
          }, 0);
          const remainingDuration = Math.max(0, totalDuration - watchedDuration);
          const lastOpened = chapterLectures
            .map((l) => allProgress[l.id]?.updatedAt || 0)
            .sort((a, b) => b - a)[0];

          return (
            <motion.button key={ch.id} onClick={() => navigate({ name: 'chapter', subjectSlug: subject.slug, chapterSlug: ch.slug })}
              className="group w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }} whileTap={{ scale: 1.01 }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{ch.title}</h3>
                  {ch.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ch.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {totalCount} lectures</span>
                    {totalDuration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(totalDuration)}</span>}
                    {remainingDuration > 0 && completionPct < 100 && <span className="text-primary-500">{formatDuration(remainingDuration)} left</span>}
                    {lastOpened && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {timeAgo(lastOpened)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {completionPct > 0 && (
                    <div className="text-right">
                      <p className={`text-sm font-bold ${completionPct === 100 ? 'text-success-500' : 'text-primary-500'}`}>{completionPct}%</p>
                      {completionPct === 100 && <CheckCircle className="w-3 h-3 text-success-500 mx-auto" />}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
              {completionPct > 0 && (
                <div className="h-1 rounded-full bg-gray-100 mt-3 overflow-hidden">
                  <motion.div className={`h-full rounded-full ${completionPct === 100 ? 'bg-success-500' : 'bg-gradient-to-r from-primary-500 to-accent-400'}`}
                    initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              )}
            </motion.button>
          );
        })}
        {chapters.length === 0 && <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center"><BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No chapters yet.</p></div>}
      </div>
    </div>
  );
}

function timeAgo(timestamp: number): string {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ChapterPage({ subjectSlug, chapterSlug, currentLectureId }: { subjectSlug: string; chapterSlug: string; currentLectureId?: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subLoading } = useSubject(subjectSlug);
  const { chapters, loading: chLoading } = useChaptersBySubjectSlug(subjectSlug);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures, loading: lecLoading } = useLectures(chapter?.id);

  if (subLoading || chLoading || lecLoading) return <div className="pt-20 max-w-4xl mx-auto px-4"><div className="h-8 w-48 skeleton rounded-lg mb-4" /><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div></div>;
  if (!chapter) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Chapter not found.</p></div>;

  const allProgress = getAllProgress();
  const completedCount = lectures.filter((l) => allProgress[l.id]?.completed).length;
  const completionPct = lectures.length > 0 ? Math.round((completedCount / lectures.length) * 100) : 0;
  const totalDuration = lectures.reduce((sum, l) => sum + l.duration_seconds, 0);

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-4xl mx-auto px-4">
      <motion.button onClick={() => subject && navigate({ name: 'course', slug: subject.slug })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 mt-4 transition-colors"
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}><ChevronLeft className="w-4 h-4" /> {subject?.title || 'Back'}</motion.button>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-bold text-2xl text-gray-900 mb-1">{chapter.title}</h1>
        {chapter.description && <p className="text-sm text-gray-500 mb-4">{chapter.description}</p>}
        {lectures.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5"><span>{completedCount}/{lectures.length} completed</span><span className="text-primary-500 font-semibold">{completionPct}%</span></div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400" initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} /></div>
            </div>
            <div className="text-right text-xs text-gray-400"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(totalDuration)}</span></div>
          </div>
        )}
      </motion.div>
      <div className="space-y-2">
        {lectures.map((lec, i) => {
          const prog = getProgress(lec.id);
          const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
          const isCompleted = prog?.completed;
          return (
            <motion.button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lec.id })}
              className={`group w-full bg-white border rounded-2xl p-4 flex items-center gap-3 text-left hover:shadow-soft transition-all duration-300 ${lec.id === currentLectureId ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-200 hover:border-primary-200'}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
              <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                {isCompleted ? (
                  <div className="absolute inset-0 bg-success-600/40 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>
                ) : (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors"><Play className="w-4 h-4 text-white fill-white" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {lec.is_pinned && <Pin className="w-3 h-3 text-primary-500 flex-shrink-0" />}
                  {lec.is_new && <span className="badge bg-primary-50 text-primary-600 border border-primary-200 text-[9px]">NEW</span>}
                  {lec.is_live && (
                    <span className="inline-flex items-center gap-0.5 bg-red-500 text-white rounded px-1 py-0.5 text-[8px] font-bold tracking-wide flex-shrink-0">
                      <Radio className="w-2 h-2 text-white fill-white" /> LIVE
                    </span>
                  )}
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{lec.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" /> {formatDuration(lec.duration_seconds)}
                  {lec.teacher_name && <><span>·</span><span>{lec.teacher_name}</span></>}
                  {lec.pdf_url && <span className="flex items-center gap-0.5 text-primary-500"><FileText className="w-3 h-3" /> PDF</span>}
                </div>
                {pct > 0 && <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: isCompleted ? '#22c55e' : '#14b8a6' }} /></div>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
            </motion.button>
          );
        })}
        {lectures.length === 0 && <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center"><FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No lectures in this chapter yet.</p></div>}
      </div>
    </div>
  );
}
