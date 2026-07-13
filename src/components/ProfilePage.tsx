import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle, Clock, Play, ChevronRight, Trash2, Award, Settings, Moon, Bell, Download, Bookmark } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAllLectures, formatDuration } from '../lib/hooks';
import { getAllProgress, getContinueWatching, clearAllProgress } from '../lib/storage';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

export function ProfilePage() {
  const { navigate } = useRouter();
  const { lectures, loading } = useAllLectures();
  const allProgress = useMemo(() => getAllProgress(), []);
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});

  const completedLectures = lectures.filter((l) => allProgress[l.id]?.completed);
  const continueWatching = getContinueWatching().map(({ lectureId }) => lectures.find((l) => l.id === lectureId)).filter(Boolean).slice(0, 5) as typeof lectures;
  const totalWatchTime = Object.values(allProgress).reduce((sum, p) => sum + (p.position || 0), 0);
  const bookmarkedLectures = lectures.filter((l) => bookmarks[l.id]);
  const completionRate = lectures.length > 0 ? Math.round((completedLectures.length / lectures.length) * 100) : 0;

  const toggleBookmark = (id: string) => setBookmarks((p) => ({ ...p, [id]: !p[id] }));
  const handleClearProgress = () => { if (confirm('Clear all your progress? This cannot be undone.')) { clearAllProgress(); window.location.reload(); } };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-20 pb-24 lg:pb-12">
      <motion.div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 mt-4 relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pink-100/50 blur-3xl" />
        <div className="flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}>
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-gray-900">Achiever</h1>
            <p className="text-sm text-gray-500">Achiever OS Student</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-[10px] text-gray-400">Completion</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-500" />} value={completedLectures.length.toString()} label="Completed" />
        <StatCard icon={<Clock className="w-5 h-5 text-pink-500" />} value={formatDuration(totalWatchTime)} label="Watch Time" />
        <StatCard icon={<Award className="w-5 h-5 text-amber-500" />} value={completedLectures.length.toString()} label="Certificates" />
      </div>

      {continueWatching.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2"><Play className="w-4 h-4 text-pink-500" /> Continue Learning</h2>
          <div className="space-y-2">
            {continueWatching.map((lecture) => {
              const prog = allProgress[lecture.id];
              const pct = prog && lecture.duration_seconds > 0 ? Math.min(100, (prog.position / lecture.duration_seconds) * 100) : 0;
              return (
                <motion.button key={lecture.id} onClick={() => navigate({ name: 'lecture', subjectSlug: lecture.chapter?.subject?.slug || '', chapterSlug: lecture.chapter?.slug || '', lectureId: lecture.id })}
                  className="bg-white border border-gray-200 rounded-2xl p-3 w-full flex items-center gap-3 text-left group hover:shadow-md hover:border-gray-300 transition-all" whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={lecture.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors"><Play className="w-4 h-4 text-white fill-white" /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 mb-1">{lecture.title}</p>
                    <p className="text-[10px] text-gray-400 mb-1.5">{lecture.chapter?.subject?.title}</p>
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full bg-pink-500" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-pink-500 transition-colors flex-shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {bookmarkedLectures.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4 text-pink-500" /> Bookmarks</h2>
          <div className="space-y-2">
            {bookmarkedLectures.map((lecture) => (
              <div key={lecture.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0"><Bookmark className="w-4 h-4 text-pink-500 fill-pink-500" /></div>
                <p className="text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">{lecture.title}</p>
                <button onClick={() => toggleBookmark(lecture.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2"><Download className="w-4 h-4 text-pink-500" /> Downloads</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <Download className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No downloads yet. Download lessons for offline study.</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2"><Settings className="w-4 h-4 text-gray-400" /> Settings</h2>
        <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
          <SettingRow icon={<Moon className="w-4 h-4 text-gray-500" />} title="Dark Mode" subtitle="Always on" badge="Off" />
          <SettingRow icon={<Bell className="w-4 h-4 text-gray-500" />} title="Notifications" subtitle="New lesson alerts" badge="Off" />
          <SettingRow icon={<Download className="w-4 h-4 text-gray-500" />} title="Download Quality" subtitle="Standard (480p)" chevron />
        </div>
      </section>

      {Object.keys(allProgress).length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <button onClick={handleClearProgress} className="text-xs text-red-500/70 hover:text-red-500 flex items-center gap-1.5 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Clear all progress</button>
        </div>
      )}
      {loading && <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-2xl h-16 animate-pulse" />)}</div>}
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
      <span className="text-lg font-bold text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

function SettingRow({ icon, title, subtitle, badge, chevron }: { icon: React.ReactNode; title: string; subtitle: string; badge?: string; chevron?: boolean }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
        <div><p className="text-sm font-semibold text-gray-900">{title}</p><p className="text-[11px] text-gray-400">{subtitle}</p></div>
      </div>
      {badge && <span className="badge bg-gray-100 text-gray-500">{badge}</span>}
      {chevron && <ChevronRight className="w-4 h-4 text-gray-300" />}
    </div>
  );
}
