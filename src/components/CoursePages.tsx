import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Clock, FileText, Pin, BookOpen } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubjects, useSubject, useChaptersBySubjectSlug, useLectures, formatDuration } from '../lib/hooks';
import * as LucideIcons from 'lucide-react';
import { getProgress } from '../lib/storage';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

function getIcon(name: string | null) {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

export function CourseListPage() {
  const { navigate } = useRouter();
  const { subjects, loading } = useSubjects();

  if (loading) return <div className="pt-20 pb-24 max-w-7xl mx-auto px-4"><div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div></div>;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <h1 className="font-bold text-2xl text-gray-900 mb-1 mt-4">All Courses</h1>
      <p className="text-sm text-gray-500 mb-6">Browse all subjects and chapters</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s, i) => {
          const Icon = getIcon(s.icon);
          return (
            <motion.button key={s.id} onClick={() => navigate({ name: 'course', slug: s.slug })}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-lg hover:border-pink-200 transition-all"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color || '#ec4899'}15` }}>
                  <Icon className="w-6 h-6" style={{ color: s.color || '#ec4899' }} />
                </div>
                <div><h3 className="font-bold text-gray-900">{s.title}</h3>{s.description && <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
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

  if (subLoading || chLoading) return <div className="pt-20 max-w-4xl mx-auto px-4"><div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4" /><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div></div>;
  if (!subject) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Subject not found.</p></div>;

  const Icon = getIcon(subject.icon);

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-4xl mx-auto px-4">
      <button onClick={() => navigate({ name: 'courses' })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 mt-4"><ChevronLeft className="w-4 h-4" /> Courses</button>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${subject.color || '#ec4899'}15` }}><Icon className="w-8 h-8" style={{ color: subject.color || '#ec4899' }} /></div>
        <div><h1 className="font-bold text-2xl text-gray-900">{subject.title}</h1>{subject.description && <p className="text-sm text-gray-500">{subject.description}</p>}</div>
      </div>
      <div className="space-y-3">
        {chapters.map((ch, i) => (
          <motion.button key={ch.id} onClick={() => navigate({ name: 'chapter', subjectSlug: subject.slug, chapterSlug: ch.slug })}
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between text-left hover:shadow-md hover:border-gray-300 transition-all"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div><h3 className="font-semibold text-gray-900 text-sm">{ch.title}</h3>{ch.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ch.description}</p>}</div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </motion.button>
        ))}
        {chapters.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No chapters yet.</p>}
      </div>
    </div>
  );
}

export function ChapterPage({ subjectSlug, chapterSlug, currentLectureId }: { subjectSlug: string; chapterSlug: string; currentLectureId?: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subLoading } = useSubject(subjectSlug);
  const { chapters, loading: chLoading } = useChaptersBySubjectSlug(subjectSlug);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures, loading: lecLoading } = useLectures(chapter?.id);

  if (subLoading || chLoading || lecLoading) return <div className="pt-20 max-w-4xl mx-auto px-4"><div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-4" /><div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div></div>;
  if (!chapter) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Chapter not found.</p></div>;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-4xl mx-auto px-4">
      <button onClick={() => subject && navigate({ name: 'course', slug: subject.slug })} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 mt-4"><ChevronLeft className="w-4 h-4" /> {subject?.title || 'Back'}</button>
      <h1 className="font-bold text-2xl text-gray-900 mb-1">{chapter.title}</h1>
      {chapter.description && <p className="text-sm text-gray-500 mb-6">{chapter.description}</p>}
      <div className="space-y-2">
        {lectures.map((lec, i) => {
          const prog = getProgress(lec.id);
          const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
          return (
            <motion.button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lec.id })}
              className={`w-full bg-white border rounded-2xl p-4 flex items-center gap-3 text-left hover:shadow-md transition-all ${lec.id === currentLectureId ? 'border-pink-300 ring-2 ring-pink-100' : 'border-gray-200 hover:border-gray-300'}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {lec.is_pinned && <Pin className="w-3 h-3 text-pink-500 flex-shrink-0" />}
                  {lec.is_new && <span className="badge bg-pink-50 text-pink-600 border border-pink-200 text-[9px]">NEW</span>}
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{lec.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" /> {formatDuration(lec.duration_seconds)}
                  {lec.teacher_name && <><span>·</span><span>{lec.teacher_name}</span></>}
                </div>
                {pct > 0 && <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden"><div className="h-full rounded-full bg-pink-500" style={{ width: `${pct}%` }} /></div>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </motion.button>
          );
        })}
        {lectures.length === 0 && <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center"><FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No lectures in this chapter yet.</p></div>}
      </div>
    </div>
  );
}
