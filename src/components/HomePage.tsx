import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, Clock, Flame, Target, TrendingUp, PlayCircle, BarChart3, Award, Radio, CheckCircle, GraduationCap } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubjects, useAllChapters, useAllLectures, useTeachers, formatDuration } from '../lib/hooks';
import { getStudyStreak, getTodayStudySeconds, getDailyGoal, getWeeklyStudySeconds, getTotalStudySeconds, getCourseProgress, getContinueWatching, getLastOpenedLectures, getProgress } from '../lib/storage';
import * as LucideIcons from 'lucide-react';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

function getIcon(name: string | null): React.ComponentType<{ className?: string; style?: React.CSSProperties }> {
  if (!name) return BookOpen;
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[name];
  return Icon || BookOpen;
}

function ProgressRing({ percent, size = 56, stroke = 5 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2={size} y2={size}>
          <stop stopColor="#14b8a6" /><stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 3600);
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div className="flex items-end justify-between gap-1.5 h-20">
      {data.map((sec, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex-1 flex items-end">
            <motion.div className="w-full rounded-md bg-gradient-to-t from-primary-500 to-accent-400"
              initial={{ height: 0 }} animate={{ height: `${Math.max(4, (sec / max) * 100)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ minHeight: '4px' }} />
          </div>
          <span className="text-[9px] text-gray-400 font-medium">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { navigate } = useRouter();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { chapters, loading: chaptersLoading } = useAllChapters();
  const { lectures } = useAllLectures();
  const { teachers } = useTeachers();

  if (subjectsLoading || chaptersLoading) return <HomeSkeleton />;

  const streak = getStudyStreak();
  const todaySec = getTodayStudySeconds();
  const goalSec = getDailyGoal();
  const goalPct = Math.min(100, (todaySec / goalSec) * 100);
  const weekly = getWeeklyStudySeconds();
  const totalSec = getTotalStudySeconds();
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter((l) => getCourseProgress([l.id]) === 100).length;
  const continueWatching = getContinueWatching().slice(0, 10);
  const recentlyViewed = getLastOpenedLectures().slice(0, 10);
  const overallPct = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  const liveLectures = lectures.filter((l) => l.is_live).slice(0, 6);

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      {/* Hero stats */}
      <motion.div className="mb-6 mt-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500">Continue your exam preparation journey</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Study Streak */}
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }}>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><Flame className="w-5 h-5 text-amber-500" /></div>
          <div><p className="text-xs text-gray-400">Study Streak</p><p className="font-bold text-lg text-gray-900">{streak} <span className="text-xs font-medium text-gray-400">days</span></p></div>
        </motion.div>
        {/* Today's Goal */}
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
          <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0"><Target className="w-5 h-5 text-primary-500" /></div>
          <div><p className="text-xs text-gray-400">Today's Goal</p><p className="font-bold text-lg text-gray-900">{Math.round(goalPct)}<span className="text-xs font-medium text-gray-400">%</span></p></div>
        </motion.div>
        {/* Hours Studied */}
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Clock className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-xs text-gray-400">Hours Studied</p><p className="font-bold text-lg text-gray-900">{Math.round(totalSec / 3600 * 10) / 10}<span className="text-xs font-medium text-gray-400">h</span></p></div>
        </motion.div>
        {/* Completion */}
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }}>
          <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0"><Award className="w-5 h-5 text-success-500" /></div>
          <div><p className="text-xs text-gray-400">Completion</p><p className="font-bold text-lg text-gray-900">{overallPct}<span className="text-xs font-medium text-gray-400">%</span></p></div>
        </motion.div>
      </div>

      {/* Live Classes + Weekly Graph */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Live Classes */}
        <motion.div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              Live Classes
            </h2>
          </div>
          {liveLectures.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {liveLectures.map((lec) => {
                const ch = lec.chapter;
                return (
                  <button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug: ch?.subject?.slug || '', chapterSlug: ch?.slug || '', lectureId: lec.id })}
                    className="group flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><PlayCircle className="w-5 h-5 text-white" /></div>
                      <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-red-500 rounded px-1 py-0.5">
                        <Radio className="w-2.5 h-2.5 text-white fill-white" />
                        <span className="text-[8px] font-bold text-white tracking-wide">LIVE</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2">{lec.title}</p>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{ch?.subject?.title} · {ch?.title}</p>
                      <p className="text-[10px] text-red-500 font-medium mt-0.5">
                        {lec.teacher_name || 'Live Class'}
                        {lec.start_date && <span className="text-gray-400 ml-1">· {new Date(lec.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Radio className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No live classes right now. Check back later.</p>
            </div>
          )}
        </motion.div>

        {/* Weekly Study Graph */}
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.35 }}>
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-primary-500" /> Weekly Activity</h2>
          <WeeklyChart data={weekly} />
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div><p className="text-[10px] text-gray-400">This week</p><p className="text-sm font-bold text-gray-900">{Math.round(weekly.reduce((a, b) => a + b, 0) / 3600 * 10) / 10}h</p></div>
            <div className="text-right"><p className="text-[10px] text-gray-400">Daily avg</p><p className="text-sm font-bold text-gray-900">{Math.round(weekly.reduce((a, b) => a + b, 0) / 7 / 60)}m</p></div>
          </div>
        </motion.div>
      </div>

      {/* Today's Goal Progress Ring */}
      <motion.div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-center gap-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35 }}>
        <div className="relative">
          <ProgressRing percent={goalPct} size={64} stroke={6} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-900">{Math.round(goalPct)}%</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-500" /> Today's Goal</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatDuration(todaySec)} of {formatDuration(goalSec)} studied today</p>
          <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden max-w-xs">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400" initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </div>
      </motion.div>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
          <h2 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary-500" /> Continue Watching
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {continueWatching.map(({ lectureId }) => {
              const lec = lectures.find((l) => l.id === lectureId);
              if (!lec) return null;
              const ch = lec.chapter;
              const prog = getProgress(lectureId);
              const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
              return (
                <button key={lectureId} onClick={() => navigate({ name: 'lecture', subjectSlug: ch?.subject?.slug || '', chapterSlug: ch?.slug || '', lectureId })}
                  className="group flex-shrink-0 w-56 bg-white border border-gray-200 rounded-2xl p-3 text-left hover:shadow-premium hover:border-primary-200 transition-all duration-300">
                  <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2">
                    <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div className="h-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2">{lec.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{ch?.title}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <h2 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> Recently Viewed
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {recentlyViewed.map(({ lectureId }) => {
              const lec = lectures.find((l) => l.id === lectureId);
              if (!lec) return null;
              const ch = lec.chapter;
              const prog = getProgress(lectureId);
              const isCompleted = prog?.completed;
              return (
                <button key={lectureId} onClick={() => navigate({ name: 'lecture', subjectSlug: ch?.subject?.slug || '', chapterSlug: ch?.slug || '', lectureId })}
                  className="group flex-shrink-0 w-44 bg-white border border-gray-200 rounded-2xl p-2.5 text-left hover:shadow-soft hover:border-primary-200 transition-all duration-300">
                  <div className="relative w-full h-20 rounded-lg overflow-hidden mb-2">
                    <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                    {isCompleted && <div className="absolute inset-0 bg-success-600/40 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-white" /></div>}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-1">{lec.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{ch?.title}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Teachers Quick Link */}
      <motion.div className="mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <button
          onClick={() => navigate({ name: 'teachers' })}
          className="group w-full bg-gradient-to-r from-primary-500 to-accent-400 rounded-3xl p-5 flex items-center justify-between text-white hover:shadow-premium transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Our Teachers</h3>
              <p className="text-xs text-white/80">Learn from expert educators</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      {/* Subjects */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
        <h2 className="font-bold text-lg text-gray-900 mb-1">Our Batches</h2>
        <p className="text-sm text-gray-500 mb-4">Choose a batch to start learning</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((subject, i) => {
          const Icon = getIcon(subject.icon);
          const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
          const subjectLectureIds = lectures
            .filter((l) => subjectChapters.some((c) => c.id === l.chapter_id))
            .map((l) => l.id);
          const subjectProgress = subjectLectureIds.length > 0 ? getCourseProgress(subjectLectureIds) : 0;
          return (
            <motion.button
              key={subject.id}
              onClick={() => navigate({ name: 'course', slug: subject.slug })}
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 text-left overflow-hidden hover:shadow-premium hover:border-primary-200 transition-all duration-300"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 1.02 }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${(subject.color || '#14b8a6')}10, transparent 70%)` }} />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${subject.color || '#14b8a6'}15` }}>
                <Icon className="w-7 h-7" style={{ color: subject.color || '#14b8a6' }} />
              </div>
              <h3 className="relative font-bold text-base text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">{subject.title}</h3>
              {(() => {
                const teacher = teachers.find((t) => t.id === subject.teacher_id);
                return teacher ? (
                  <p className="relative text-[11px] text-primary-500 font-medium mb-1 flex items-center gap-1">
                    <GraduationCap className="w-2.5 h-2.5" /> {teacher.name}
                  </p>
                ) : null;
              })()}
              <div className="relative flex items-center gap-2 text-xs text-gray-400">
                <span>{subjectChapters.length} chapters</span>
                {subjectProgress > 0 && <><span>·</span><span className="text-primary-500 font-medium">{subjectProgress}%</span></>}
              </div>
              {subjectProgress > 0 && (
                <div className="relative h-1 rounded-full bg-gray-100 mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400" style={{ width: `${subjectProgress}%` }} />
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

function HomeSkeleton() {
  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <div className="mb-6 mt-4">
        <div className="h-8 w-48 skeleton rounded-lg mb-2" />
        <div className="h-4 w-64 skeleton rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 h-48 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
      <div className="h-20 skeleton rounded-2xl mb-6" />
      <div className="h-6 w-32 skeleton rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton rounded-2xl p-5">
            <div className="w-14 h-14 skeleton rounded-2xl mb-4" />
            <div className="h-4 w-24 skeleton rounded mb-2" />
            <div className="h-3 w-32 skeleton rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
