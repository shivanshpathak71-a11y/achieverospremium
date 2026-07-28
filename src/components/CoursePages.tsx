import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Play, Clock, FileText, Pin, BookOpen,
  CheckCircle, Calendar, Radio, Users,
  ChevronDown, Award, Youtube, Layers,
  GraduationCap, ArrowRight, TrendingUp, Gift,
  Video, Info, Download, StickyNote, CalendarClock, FolderOpen
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubjects, useSubject, useChaptersBySubjectSlug, useLectures, useAllLectures, useAllChapters, useCourseNotes, useFoldersBySubject, useTopicsByChapter, useTeachers, formatDuration } from '../lib/hooks';
import { getProgress, getCourseProgress, getAllProgress } from '../lib/storage';
import { Breadcrumbs } from './Breadcrumbs';
import * as LucideIcons from 'lucide-react';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

function getIcon(name: string | null) {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

/* ─── FAQ Accordion ─── */
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-primary-200 shadow-soft' : 'border-gray-200'}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${open ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {index + 1}
          </div>
          <span className="font-semibold text-sm text-gray-900">{question}</span>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'bg-primary-50 rotate-180' : 'bg-gray-50'}`}>
          <ChevronDown className={`w-4 h-4 transition-colors ${open ? 'text-primary-600' : 'text-gray-400'}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pl-16 text-sm text-gray-600 leading-relaxed">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Section Heading ─── */
function SectionHeading({ icon: Icon, title, accent = 'primary' }: { icon: typeof BookOpen; title: string; accent?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary-500 bg-primary-50',
    amber: 'text-amber-500 bg-amber-50',
    blue: 'text-blue-500 bg-blue-50',
    rose: 'text-rose-500 bg-rose-50',
    green: 'text-success-500 bg-success-50',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[accent] || colorMap.primary}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-bold text-lg text-gray-900">{title}</h2>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COURSE LIST PAGE
   ═══════════════════════════════════════════════════ */
export function CourseListPage() {
  const { navigate } = useRouter();
  const { subjects, loading } = useSubjects();
  const { chapters } = useAllChapters();
  const { lectures } = useAllLectures();
  const { teachers } = useTeachers();

  if (loading) return (
    <div className="pt-20 pb-24 max-w-7xl mx-auto px-4">
      <div className="h-10 w-56 skeleton rounded-xl mb-4" />
      <div className="h-4 w-72 skeleton rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-40 skeleton rounded-3xl" />)}</div>
    </div>
  );

  return (
    <div className="pt-20 pb-24 lg:pb-16 max-w-7xl mx-auto px-4">
      <motion.div className="mb-8 mt-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        
        <h1 className="font-extrabold text-3xl sm:text-4xl text-gray-900 tracking-tight">Our Batches</h1>
        <p className="text-sm text-gray-500 mt-1">Browse all batches and start your preparation journey.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((s, i) => {
          const Icon = getIcon(s.icon);
          const subjectChapters = chapters.filter((c) => c.subject_id === s.id);
          const subjectLectureIds = lectures
            .filter((l) => subjectChapters.some((c) => c.id === l.chapter_id))
            .map((l) => l.id);
          const progress = subjectLectureIds.length > 0 ? getCourseProgress(subjectLectureIds) : 0;
          const color = s.color || '#14b8a6';

          return (
            <motion.button
              key={s.id}
              onClick={() => navigate({ name: 'course', slug: s.slug })}
              className="group relative bg-white border border-gray-200 rounded-3xl p-6 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-400 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 1.01 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${color}12, transparent 60%)` }} />
              <div className="relative flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-400 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: `${color}15` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                {progress > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-gray-900">{progress}<span className="text-sm text-gray-400">%</span></p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Progress</p>
                  </div>
                )}
              </div>
              <h3 className="relative font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors mb-1">{s.title}</h3>
              {(() => {
                const teacher = teachers.find((t) => t.id === s.teacher_id);
                return teacher ? (
                  <p className="relative text-xs text-primary-500 font-medium mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> {teacher.name}
                  </p>
                ) : null;
              })()}
              {s.short_description && <p className="relative text-xs text-gray-500 line-clamp-2 mb-3">{s.short_description}</p>}
              {!s.short_description && s.description && <p className="relative text-xs text-gray-400 line-clamp-2 mb-4">{s.description}</p>}
              <div className="relative flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {subjectChapters.length} chapters</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {subjectLectureIds.length} lectures</span>
              </div>
              {progress > 0 && (
                <div className="relative h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: 0.3 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              )}
              <div className="relative flex items-center gap-1.5 text-sm font-semibold text-primary-600 group-hover:gap-2.5 transition-all">
                {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COURSE DETAIL PAGE — Two-column layout
   Left: lectures, Right: course details
   ═══════════════════════════════════════════════════ */
export function CourseDetailPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subLoading } = useSubject(slug);
  const { chapters, loading: chLoading } = useChaptersBySubjectSlug(slug);
  const { folders, loading: foldersLoading } = useFoldersBySubject(subject?.id);
  const { lectures } = useAllLectures();
  const { notes, loading: notesLoading } = useCourseNotes(subject?.id);
  const [activeTab, setActiveTab] = useState<'detail' | 'content'>('detail');

  if (subLoading || chLoading || foldersLoading) return (
    <div className="pt-20 max-w-4xl mx-auto px-4">
      <div className="h-56 skeleton rounded-3xl mb-6" />
      <div className="h-12 skeleton rounded-2xl mb-6" />
      <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>
    </div>
  );
  if (!subject) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Batch not found.</p></div>;

  const Icon = getIcon(subject.icon);
  const allProgress = getAllProgress();
  const color = subject.color || '#14b8a6';
  const subjectLectures = lectures.filter((l) => chapters.some((c) => c.id === l.chapter_id));
  const totalLectures = subjectLectures.length;
  const completedLectures = subjectLectures.filter((l) => allProgress[l.id]?.completed).length;
  const overallPct = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const hasTimetable = subject.time_table && subject.time_table.length > 0;
  const hasFaculty = subject.faculty_details;
  const hasFaqs = subject.faqs && subject.faqs.length > 0;
  const hasHighlights = subject.course_highlights && subject.course_highlights.length > 0;
  const freeLectures = subjectLectures.filter((l) => l.is_free).slice(0, 10);
  const liveNow = subjectLectures.filter((l) => l.is_live);
  const now = new Date();
  const upcoming = subjectLectures
    .filter((l) => l.start_date && new Date(l.start_date) > now && !l.is_live)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 6);

  const featureBadges: { icon: typeof Radio; label: string }[] = [
    { icon: Radio, label: 'Live + Recorded' },
    { icon: FileText, label: 'Online Test & Sheets' },
  ];
  if (subject.main_category) featureBadges.push({ icon: CheckCircle, label: 'Useful For: ' + subject.main_category });
  featureBadges.push(
    { icon: Video, label: 'Live Classes + Recorded access' },
    { icon: StickyNote, label: 'Pdf Notes' },
  );
  if (subject.is_free) featureBadges.push({ icon: Gift, label: 'Free Batch' });

  return (
    <div className="pt-16 pb-24 lg:pb-16 max-w-4xl mx-auto px-4">
      {/* Back button */}
      <motion.button
        onClick={() => navigate({ name: 'courses' })}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 mt-4 transition-colors group"
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      >
        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center group-hover:border-primary-200 group-hover:bg-primary-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        <span>All Batches</span>
      </motion.button>

      {/* ─── Hero Banner ─── */}
      <motion.div
        className="relative rounded-3xl overflow-hidden mb-4 shadow-premium"
        initial={{ opacity: 0, y: 16, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {subject.banner_url ? (
          <div className="relative h-48 sm:h-56">
            <img src={subject.banner_url} alt={subject.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
          </div>
        ) : (
          <div className="relative h-36" style={{ background: 'linear-gradient(135deg, ' + color + ', ' + color + 'cc)' }}>
            <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 50%, white, transparent 60%)' }} />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md" style={{ background: color + '30', border: '1px solid ' + color + '40' }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            {subject.is_free && (
              <span className="px-2.5 py-1 rounded-full bg-success-500/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1">
                <Gift className="w-3 h-3" /> FREE
              </span>
            )}
          </div>
          <h1 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight mb-0.5">{subject.title}</h1>
          {subject.short_description && <p className="text-sm text-white/80 line-clamp-2 max-w-xl">{subject.short_description}</p>}
        </div>
      </motion.div>

      {/* ─── Feature Badges ─── */}
      <motion.div
        className="flex flex-wrap gap-2 mb-5"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}
      >
        {featureBadges.map((badge, i) => {
          const BIcon = badge.icon;
          return (
            <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700">
              <BIcon className="w-3.5 h-3.5 text-primary-500" />
              {badge.label}
            </div>
          );
        })}
      </motion.div>

      {/* ─── Progress + Stats Row ─── */}
      <motion.div
        className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-success-500 bg-success-50">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">Progress</p>
            <p className="font-bold text-sm text-gray-900">{overallPct}%</p>
          </div>
        </div>
        {[
          { icon: Video, label: 'Recorded', value: subject.recorded_classes_count || totalLectures, color: 'text-blue-500 bg-blue-50' },
          { icon: Radio, label: 'Live', value: subject.live_classes_count || liveNow.length, color: 'text-rose-500 bg-rose-50' },
          { icon: Users, label: 'Students', value: subject.student_count || 0, color: 'text-amber-500 bg-amber-50' },
        ].filter((s) => s.value != null && s.value !== 0).map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-2.5">
            <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + s.color}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="font-bold text-sm text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ═══ TAB BAR — Only 2 tabs like selectionway ═══ */}
      <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-2xl p-1.5 sticky top-16 z-30 backdrop-blur-lg bg-white/90">
        {[
          { id: 'detail' as const, label: 'Batch Detail', icon: Info },
          { id: 'content' as const, label: 'Batch Content', icon: Video },
        ].map((tab) => {
          const TIcon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ' + (activeTab === tab.id ? 'bg-primary-600 text-white shadow-soft' : 'text-gray-500 hover:bg-gray-50')}>
              <TIcon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ BATCH DETAIL TAB ═══ */}
      {activeTab === 'detail' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">

          {/* ─── Batch Demo Videos (horizontal scroll like selectionway) ─── */}
          {freeLectures.length > 0 && (
            <div>
              <SectionHeading icon={Play} title="Batch Demo Videos" accent="green" />
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
                {freeLectures.map((l, i) => {
                  const ch = chapters.find((c) => c.id === l.chapter_id);
                  return (
                    <motion.button key={l.id}
                      onClick={() => navigate({ name: 'lecture', subjectSlug: subject.slug, chapterSlug: ch?.slug || '', lectureId: l.id })}
                      className="group flex-shrink-0 w-64 bg-white border border-gray-200 rounded-2xl overflow-hidden text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      whileHover={{ y: -3 }}>
                      <div className="relative w-full h-36">
                        <img src={l.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 text-primary-600 fill-primary-600 ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-500 text-white text-[10px] font-bold">
                          <Gift className="w-2.5 h-2.5" /> FREE
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{l.title}</p>
                        {ch && <p className="text-[10px] text-gray-400">{ch.title}</p>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Faculty Details ─── */}
          {hasFaculty && (
            <div>
              <SectionHeading icon={GraduationCap} title="Faculty Details" accent="blue" />
              <motion.div
                className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  {subject.faculty_details!.imageUrl && (
                    <div className="relative flex-shrink-0">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-soft">
                        <img src={subject.faculty_details!.imageUrl} alt={subject.faculty_details!.name} className="w-full h-full object-cover" />
                      </div>
                      {subject.faculty_details!.experience && (
                        <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-blue-500 text-white text-[10px] font-bold whitespace-nowrap shadow-soft">
                          {subject.faculty_details!.experience}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{subject.faculty_details!.name}</h3>
                      {subject.faculty_details!.designation && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold">{subject.faculty_details!.designation}</span>
                      )}
                    </div>
                    {subject.faculty_details!.reach && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold mb-3">
                        <GraduationCap className="w-3.5 h-3.5" />
                        TRUSTED BY {subject.faculty_details!.reach}
                      </div>
                    )}
                    {subject.faculty_details!.description && (
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{subject.faculty_details!.description}</p>
                    )}
                    {subject.faculty_details!.socialLinks && subject.faculty_details!.socialLinks.length > 0 && (
                      <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                        {subject.faculty_details!.socialLinks.map((link, i) => (
                          <a key={i} href={link} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-colors">
                            <Youtube className="w-3.5 h-3.5" /> Watch on YouTube
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ─── Batch Highlights ─── */}
          {hasHighlights && (
            <div>
              <SectionHeading icon={Award} title="Batch Highlights" accent="amber" />
              <motion.div
                className="bg-white border border-gray-200 rounded-3xl p-5 space-y-3"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              >
                {subject.course_highlights!.map((h, i) => (
                  <motion.div key={i} className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.25 }}>
                    <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-primary-500" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{h}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* ─── Live & Upcoming Classes ─── */}
          {(liveNow.length > 0 || upcoming.length > 0) && (
            <div>
              <SectionHeading icon={CalendarClock} title="Live & Upcoming Classes" accent="rose" />
              <div className="space-y-3">
                {liveNow.map((l) => {
                  const ch = chapters.find((c) => c.id === l.chapter_id);
                  return (
                    <button key={l.id} onClick={() => navigate({ name: 'lecture', subjectSlug: subject.slug, chapterSlug: ch?.slug || '', lectureId: l.id })}
                      className="group w-full flex items-center gap-4 p-4 bg-white border border-rose-200 rounded-2xl text-left hover:shadow-premium transition-all duration-300">
                      <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Radio className="w-5 h-5 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{l.title}</p>
                        {l.teacher_name && <p className="text-xs text-gray-400 mt-0.5">{l.teacher_name}</p>}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        <Radio className="w-2.5 h-2.5 fill-white" /> LIVE
                      </span>
                    </button>
                  );
                })}
                {upcoming.map((l) => {
                  const ch = chapters.find((c) => c.id === l.chapter_id);
                  const startDate = new Date(l.start_date!);
                  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  return (
                    <button key={l.id} onClick={() => navigate({ name: 'lecture', subjectSlug: subject.slug, chapterSlug: ch?.slug || '', lectureId: l.id })}
                      className="group w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300">
                      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <CalendarClock className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900">{l.title}</p>
                        <p className="text-xs text-primary-600 font-medium mt-0.5">{dateStr} · {timeStr}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Notes & PDFs ─── */}
          {notes.length > 0 && (
            <div>
              <SectionHeading icon={StickyNote} title="Notes & PDFs" accent="primary" />
              {!notesLoading ? (
                <div className="space-y-3">
                  {notes.map((note, idx) => (
                    <motion.div key={note.id}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-soft transition-all duration-300 group"
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                      <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{note.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                          {note.category_name && <span className="px-1.5 py-0.5 rounded bg-gray-100 font-medium">{note.category_name}</span>}
                          {note.is_free && <span className="px-1.5 py-0.5 rounded bg-success-50 text-success-600 font-bold">FREE</span>}
                        </div>
                      </div>
                      <button onClick={() => window.open(note.pdf_url, '_blank')} className="btn-primary text-xs py-2 px-3.5">View</button>
                      <a href={note.pdf_url} download target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <Download className="w-4 h-4 text-gray-500" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              ) : <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>}
            </div>
          )}

          {/* ─── Timetable ─── */}
          {hasTimetable && (
            <div>
              <SectionHeading icon={Calendar} title="Weekly Timetable" accent="blue" />
              <div className="bg-white border border-gray-200 rounded-3xl p-5 space-y-2.5">
                {subject.time_table!.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-primary-200 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{entry.topic}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{entry.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── FAQs ─── */}
          {hasFaqs && (
            <div>
              <SectionHeading icon={ChevronDown} title="Frequently Asked Questions" accent="primary" />
              <div className="space-y-3">
                {subject.faqs!.map((faq, i) => (
                  <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ─── Need Help Section (like selectionway) ─── */}
          <motion.div
            className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6 text-center text-white relative overflow-hidden"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                <Info className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-lg text-white mb-1">Need any help?</h3>
              <p className="text-sm text-white/80 mb-4 max-w-sm mx-auto">Our Expert will help guide you at every step you need help</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a href="https://wa.me/8373948000" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-600 text-sm font-bold hover:bg-white/90 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.68-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14 0-.31-.01-.47-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>
                  WhatsApp Now
                </a>
                <a href="tel:+916388974650"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 text-white text-sm font-bold border border-white/20 hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  +91-6388974650
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ BATCH CONTENT TAB ═══ */}
      {activeTab === 'content' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <SectionHeading icon={FolderOpen} title="Course Content" accent="primary" />
          {folders.length > 0 && (
            <p className="text-xs text-gray-400 font-medium mb-4">{folders.length} folders · {chapters.length} chapters · {totalLectures} lectures</p>
          )}

          <div className="space-y-3">
            {folders.map((folder, i) => {
              const folderChapters = chapters.filter((c) => c.folder_id === folder.id);
              const folderLectureIds = lectures
                .filter((l) => folderChapters.some((c) => c.id === l.chapter_id))
                .map((l) => l.id);
              const completedCount = folderLectureIds.filter((id) => allProgress[id]?.completed).length;
              const totalCount = folderLectureIds.length;
              const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const totalDuration = lectures
                .filter((l) => folderChapters.some((c) => c.id === l.chapter_id))
                .reduce((sum, l) => sum + l.duration_seconds, 0);

              return (
                <motion.button
                  key={folder.id}
                  onClick={() => navigate({ name: 'folder', subjectSlug: subject.slug, folderSlug: folder.slug })}
                  className="group w-full bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative overflow-hidden"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }} whileTap={{ scale: 1.005 }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: (folder.color || '#f59e0b') + '15' }}>
                        <FolderOpen className="w-5 h-5" style={{ color: folder.color || '#f59e0b' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{folder.title}</h3>
                        {folder.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{folder.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {folderChapters.length} chapters</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {totalCount} lectures</span>
                          {totalDuration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(totalDuration)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {completionPct > 0 && (
                        <p className={completionPct === 100 ? 'text-lg font-extrabold text-success-500' : 'text-lg font-extrabold text-primary-500'}>{completionPct}<span className="text-xs text-gray-400">%</span></p>
                      )}
                      <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                  {completionPct > 0 && (
                    <div className="h-1 rounded-full bg-gray-100 mt-3 overflow-hidden">
                      <motion.div className={completionPct === 100 ? 'h-full rounded-full bg-success-500' : 'h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400'}
                        initial={{ width: 0 }} animate={{ width: completionPct + '%' }} transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }} />
                    </div>
                  )}
                </motion.button>
              );
            })}

            {folders.length === 0 && chapters.length > 0 && (
              <div className="space-y-3">
                {chapters.map((ch, i) => {
                  const chapterLectures = lectures.filter((l) => l.chapter_id === ch.id);
                  const chapterLectureIds = chapterLectures.map((l) => l.id);
                  const completionPct = chapterLectureIds.length > 0 ? getCourseProgress(chapterLectureIds) : 0;
                  return (
                    <motion.button key={ch.id}
                      onClick={() => navigate({ name: 'chapter', subjectSlug: subject.slug, chapterSlug: ch.slug })}
                      className="group w-full bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300 relative"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
                      whileHover={{ y: -2 }} whileTap={{ scale: 1.005 }}>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 transition-colors">
                          <Layers className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{ch.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">{chapterLectures.length} lectures</p>
                        </div>
                        {completionPct > 0 && <span className="text-sm font-bold text-primary-500">{completionPct}%</span>}
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-300" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {folders.length === 0 && chapters.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No content available yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   CHAPTER PAGE
   ═══════════════════════════════════════════════════ */
export function ChapterPage({ subjectSlug, chapterSlug, currentLectureId }: { subjectSlug: string; chapterSlug: string; currentLectureId?: string }) {
  const { navigate } = useRouter();
  const { subject, loading: subLoading } = useSubject(subjectSlug);
  const { chapters, loading: chLoading } = useChaptersBySubjectSlug(subjectSlug);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures, loading: lecLoading } = useLectures(chapter?.id);
  const { topics, loading: topicsLoading } = useTopicsByChapter(chapter?.id);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  if (subLoading || chLoading || lecLoading || topicsLoading) return (
    <div className="pt-20 max-w-4xl mx-auto px-4">
      <div className="h-8 w-48 skeleton rounded-lg mb-4" />
      <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
    </div>
  );
  if (!chapter) return <div className="pt-20 max-w-4xl mx-auto px-4"><p className="text-gray-400">Chapter not found.</p></div>;

  const allProgress = getAllProgress();
  const completedCount = lectures.filter((l) => allProgress[l.id]?.completed).length;
  const completionPct = lectures.length > 0 ? Math.round((completedCount / lectures.length) * 100) : 0;
  const totalDuration = lectures.reduce((sum, l) => sum + l.duration_seconds, 0);

  // Group lectures by topic or show flat list
  const hasTopics = topics.length > 0;
    const lecturesWithoutTopics = lectures.filter((l) => !l.topic_id);

  return (
    <div className="pt-16 pb-24 lg:pb-16 max-w-4xl mx-auto px-4">
      <Breadcrumbs items={[
        { label: subject?.title || 'Subject', route: { name: 'course', slug: subjectSlug } },
        { label: chapter.title },
      ]} />

      <motion.div
        className="mb-6 mt-4"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 mb-3">
          <Layers className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-xs font-semibold text-primary-600">Chapter</span>
        </div>
        <h1 className="font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight mb-1">{chapter.title}</h1>
        {chapter.description && <p className="text-sm text-gray-500">{chapter.description}</p>}
      </motion.div>

      {lectures.length > 0 && (
        <motion.div
          className="mb-6 bg-white border border-gray-200 rounded-3xl p-5 flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 font-medium">{completedCount} of {lectures.length} completed</span>
              <span className="text-primary-600 font-bold text-sm">{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400"
                initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
        </motion.div>
      )}

      {/* Topics as expandable cards */}
      {hasTopics && (
        <div className="space-y-3 mb-4">
          {topics.map((topic, i) => {
            const topicLectures = lectures.filter((l) => l.topic_id === topic.id);
            const topicCompleted = topicLectures.filter((l) => allProgress[l.id]?.completed).length;
            const topicPct = topicLectures.length > 0 ? Math.round((topicCompleted / topicLectures.length) * 100) : 0;
            const isExpanded = expandedTopic === topic.id;

            return (
              <motion.div
                key={topic.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isExpanded ? 'bg-primary-50' : 'bg-gray-100'}`}>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">{topic.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {topicLectures.length} lectures</span>
                      {topicPct > 0 && <span className="text-primary-500 font-medium">{topicPct}%</span>}
                    </div>
                  </div>
                  {topicPct > 0 && (
                    <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400" style={{ width: `${topicPct}%` }} />
                    </div>
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 space-y-2 border-t border-gray-100">
                        {topicLectures.map((lec) => (
                          <LectureRow key={lec.id} lec={lec} subjectSlug={subjectSlug} chapterSlug={chapterSlug} currentLectureId={currentLectureId} navigate={navigate} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lectures without topics (or all lectures if no topics) */}
      <div className="space-y-2.5">
        {(!hasTopics ? lectures : lecturesWithoutTopics).map((lec, i) => (
          <LectureRow key={lec.id} lec={lec} subjectSlug={subjectSlug} chapterSlug={chapterSlug} currentLectureId={currentLectureId} navigate={navigate} index={i} />
        ))}
        {lectures.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No lectures in this chapter yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LectureRow({ lec, subjectSlug, chapterSlug, currentLectureId, navigate, index }: {
  lec: import('../lib/supabase').Lecture;
  subjectSlug: string; chapterSlug: string; currentLectureId?: string;
  navigate: (r: import('../lib/router').Route) => void; index?: number;
}) {
  const prog = getProgress(lec.id);
  const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
  const isCompleted = prog?.completed;
  const hasPdf = (lec.pdf_urls && lec.pdf_urls.length > 0) || lec.pdf_url;
  const hasTest = lec.class_tests && lec.class_tests.length > 0;

  return (
    <motion.button
      onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lec.id })}
      className={`group w-full bg-white border rounded-2xl p-4 flex items-center gap-4 text-left transition-all duration-300 ${lec.id === currentLectureId ? 'border-primary-300 ring-1 ring-primary-100 shadow-soft' : 'border-gray-200 hover:border-primary-200 hover:shadow-soft'}`}
      initial={index !== undefined ? { opacity: 0, y: 10 } : false} animate={{ opacity: 1, y: 0 }} transition={index !== undefined ? { delay: index * 0.04, duration: 0.3 } : undefined}
      whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
    >
      <div className="relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0">
        <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
        {isCompleted ? (
          <div className="absolute inset-0 bg-success-600/50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {lec.is_pinned && <Pin className="w-3 h-3 text-primary-500 flex-shrink-0" />}
          {lec.is_new && <span className="badge bg-primary-50 text-primary-600 border border-primary-200 text-[9px]">NEW</span>}
          {lec.is_live && (
            <span className="inline-flex items-center gap-0.5 bg-rose-500 text-white rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wide flex-shrink-0">
              <Radio className="w-2 h-2 text-white fill-white" /> LIVE
            </span>
          )}
          {lec.is_free && !lec.is_live && (
            <span className="inline-flex items-center gap-0.5 bg-success-50 text-success-600 rounded px-1.5 py-0.5 text-[8px] font-bold flex-shrink-0">
              <Gift className="w-2.5 h-2.5" /> FREE
            </span>
          )}
          <p className="font-semibold text-gray-900 text-sm line-clamp-1">{lec.title}</p>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(lec.duration_seconds)}</span>
          {lec.teacher_name && <><span>·</span><span>{lec.teacher_name}</span></>}
          {hasPdf && <span className="flex items-center gap-0.5 text-primary-500"><FileText className="w-3 h-3" /> PDF</span>}
          {hasTest && <span className="flex items-center gap-0.5 text-amber-500"><Award className="w-3 h-3" /> Test</span>}
        </div>
        {pct > 0 && (
          <div className="h-1 rounded-full bg-gray-100 mt-2 overflow-hidden max-w-[200px]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isCompleted ? '#22c55e' : '#14b8a6' }} />
          </div>
        )}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors flex-shrink-0">
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-300" />
      </div>
    </motion.button>
  );
}
