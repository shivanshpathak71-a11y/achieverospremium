// @ts-nocheck
import { ChevronLeft, ChevronRight, BookOpen, FileText, Play, Pin, Sparkles } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useSubject, useChapters, useLectures, formatDuration } from '../lib/hooks';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import type { Lecture } from '../lib/supabase';

function getIcon(name: string) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  return Icon || BookOpen;
}

export function SubjectPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const { subject, loading } = useSubject(slug);
  const { chapters, loading: chaptersLoading } = useChapters(subject?.id);
  const Icon = subject ? getIcon(subject.icon) : BookOpen;

  if (loading || chaptersLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
        <div className="glass-card p-8 h-32 animate-pulse mb-6" />
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="glass-card h-28 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!subject) {
    return <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 text-center text-ink-400">Subject not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
      <button
        onClick={() => navigate({ name: 'home' })}
        className="flex items-center gap-1 text-sm text-ink-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Subject header */}
      <div className="relative glass-card p-8 sm:p-10 mb-8 overflow-hidden animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
        <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${subject.gradient} opacity-10 blur-3xl`} />
        <div className="relative flex items-start gap-5">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${subject.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-4xl text-white mb-2">{subject.title}</h1>
            <p className="text-ink-400 max-w-2xl">{subject.description}</p>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="grid md:grid-cols-2 gap-4">
        {chapters.map((chapter, i) => (
          <ChapterCard key={chapter.id} chapter={chapter} subjectSlug={subject.slug} index={i} />
        ))}
      </div>
    </div>
  );
}

function ChapterCard({ chapter, subjectSlug, index }: { chapter: { id: string; slug: string; title: string; description: string | null }; subjectSlug: string; index: number }) {
  const { navigate } = useRouter();
  const [lectureCount, setLectureCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('lectures')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapter.id)
      .then(({ count }) => setLectureCount(count || 0));
  }, [chapter.id]);

  return (
    <div
      onClick={() => navigate({ name: 'chapter', subjectSlug, chapterSlug: chapter.slug })}
      className="group glass-card p-5 cursor-pointer hover:scale-[1.02] hover:border-white/20 transition-all duration-300 animate-fade-in-up opacity-0-init"
      style={{ animationFillMode: 'forwards', animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-base mb-0.5 truncate">{chapter.title}</h3>
            <p className="text-xs text-ink-500 truncate">{chapter.description || `${lectureCount ?? '...'} lectures`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {lectureCount !== null && (
            <span className="badge bg-royal-500/10 text-royal-300 border border-royal-500/20">
              {lectureCount} lectures
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
}

export function ChapterPage({ subjectSlug, chapterSlug }: { subjectSlug: string; chapterSlug: string }) {
  const { navigate } = useRouter();
  const { subject } = useSubject(subjectSlug);
  const { chapters } = useChapters(subject?.id);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures, loading } = useLectures(chapter?.id);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
        <div className="glass-card h-24 animate-pulse mb-6" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="glass-card h-20 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 text-center text-ink-400">Chapter not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 pb-16">
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-6">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-white transition-colors">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate({ name: 'subject', slug: subjectSlug })} className="hover:text-white transition-colors">{subject?.title}</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white">{chapter.title}</span>
      </div>

      <div className="glass-card p-6 sm:p-8 mb-8 animate-fade-in-up opacity-0-init" style={{ animationFillMode: 'forwards' }}>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-2">{chapter.title}</h1>
        <p className="text-ink-400">{chapter.description || `${lectures.length} lectures in this chapter`}</p>
      </div>

      <div className="space-y-3">
        {lectures.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-10 h-10 text-ink-600 mx-auto mb-3" />
            <p className="text-ink-400">No lectures in this chapter yet. Check back soon!</p>
          </div>
        ) : (
          lectures.map((lecture, i) => (
            <LectureRow key={lecture.id} lecture={lecture} subjectSlug={subjectSlug} chapterSlug={chapterSlug} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

function LectureRow({ lecture, subjectSlug, chapterSlug, index }: { lecture: Lecture; subjectSlug: string; chapterSlug: string; index: number }) {
  const { navigate } = useRouter();

  return (
    <div
      onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lecture.id })}
      className="group glass-card p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.01] hover:border-white/20 transition-all duration-300 animate-fade-in-up opacity-0-init"
      style={{ animationFillMode: 'forwards', animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail */}
      <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={lecture.thumbnail_url || 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg'}
          alt={lecture.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded">
          {formatDuration(lecture.duration_seconds)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {lecture.is_pinned && (
            <span className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {lecture.is_new && (
            <span className="badge bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sparkles className="w-3 h-3" /> NEW
            </span>
          )}
        </div>
        <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1 group-hover:text-cyan-300 transition-colors">{lecture.title}</h3>
        <p className="text-xs text-ink-500 line-clamp-1 mt-0.5">{lecture.description}</p>
      </div>

      <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-white transition-colors flex-shrink-0" />
    </div>
  );
}
