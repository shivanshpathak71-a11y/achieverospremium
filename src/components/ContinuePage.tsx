// @ts-nocheck
import { Play, Clock, ChevronRight, Trash2, TrendingUp } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useProgress, formatDuration } from '../lib/hooks';
import { supabase } from '../lib/supabase';

export function ContinuePage() {
  const { navigate } = useRouter();
  const { progress, loading, refresh } = useProgress();

  const handleDelete = async (id: string) => {
    await supabase.from('progress').delete().eq('id', id);
    refresh();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-6 h-6 text-cyan-400" />
        <h1 className="font-display font-bold text-3xl text-white">Continue Learning</h1>
      </div>
      <p className="text-ink-400 mb-8">Pick up right where you left off.</p>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="glass-card h-24 animate-pulse" />)}
        </div>
      ) : progress.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Play className="w-10 h-10 text-ink-600 mx-auto mb-3" />
          <p className="text-ink-400">You haven't started any lectures yet.</p>
          <button onClick={() => navigate({ name: 'home' })} className="btn-primary mt-4">
            Browse Classes
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {progress.map((p, i) => {
            const lecture = (p as unknown as {
              lecture: {
                id: string;
                title: string;
                description: string | null;
                thumbnail_url: string | null;
                duration_seconds: number;
                chapter: { slug: string; subject: { slug: string } };
              };
            }).lecture;

            if (!lecture) return null;

            const pct = Math.min(100, (p.position_seconds / (lecture.duration_seconds || 1)) * 100);

            return (
              <div
                key={p.id}
                className="group glass-card p-4 flex items-center gap-4 animate-fade-in-up opacity-0-init"
                style={{ animationFillMode: 'forwards', animationDelay: `${i * 60}ms` }}
              >
                <div
                  onClick={() => navigate({ name: 'lecture', subjectSlug: lecture.chapter.subject.slug, chapterSlug: lecture.chapter.slug, lectureId: lecture.id })}
                  className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                >
                  <img src={lecture.thumbnail_url || 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg'} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">
                    {formatDuration(lecture.duration_seconds)}
                  </span>
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate({ name: 'lecture', subjectSlug: lecture.chapter.subject.slug, chapterSlug: lecture.chapter.slug, lectureId: lecture.id })}
                >
                  <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1 mb-1">{lecture.title}</h3>
                  <p className="text-xs text-ink-500 line-clamp-1 mb-2">{lecture.description}</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-ink-600" />
                    <span className="text-xs text-ink-500">{formatDuration(p.position_seconds)} / {formatDuration(lecture.duration_seconds)}</span>
                    {p.completed && <span className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Completed</span>}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-ink-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-royal-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => navigate({ name: 'lecture', subjectSlug: lecture.chapter.subject.slug, chapterSlug: lecture.chapter.slug, lectureId: lecture.id })}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
