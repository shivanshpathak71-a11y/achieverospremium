import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Play, Clock, ChevronRight, FileText, BookOpen, Layers, X } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAllLectures, useAllChapters, useSubjects, formatDuration } from '../lib/hooks';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

type SearchResult = {
  type: 'lecture' | 'chapter' | 'subject' | 'pdf';
  id: string;
  title: string;
  subtitle: string;
  thumbnail?: string;
  duration?: number;
  navigate: () => void;
};

export function SearchPage() {
  const { navigate } = useRouter();
  const { lectures, loading: lecLoading } = useAllLectures();
  const { chapters, loading: chLoading } = useAllChapters();
  const { subjects, loading: subLoading } = useSubjects();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'lecture' | 'chapter' | 'subject' | 'pdf'>('all');

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const all: SearchResult[] = [];

    lectures.forEach((l) => {
      if (l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.notes?.toLowerCase().includes(q) || l.teacher_name?.toLowerCase().includes(q)) {
        all.push({
          type: 'lecture', id: l.id, title: l.title,
          subtitle: `${l.chapter?.subject?.title || ''} · ${l.chapter?.title || ''}`,
          thumbnail: l.thumbnail_url || FALLBACK_THUMB, duration: l.duration_seconds,
          navigate: () => navigate({ name: 'lecture', subjectSlug: l.chapter?.subject?.slug || '', chapterSlug: l.chapter?.slug || '', lectureId: l.id }),
        });
      }
    });

    chapters.forEach((c) => {
      if (c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) {
        all.push({
          type: 'chapter', id: c.id, title: c.title,
          subtitle: c.subject?.title || '',
          navigate: () => navigate({ name: 'chapter', subjectSlug: c.subject?.slug || '', chapterSlug: c.slug }),
        });
      }
    });

    subjects.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) {
        all.push({
          type: 'subject', id: s.id, title: s.title,
          subtitle: s.description || '',
          navigate: () => navigate({ name: 'course', slug: s.slug }),
        });
      }
    });

    lectures.forEach((l) => {
      if (l.pdf_url && l.title.toLowerCase().includes(q)) {
        all.push({
          type: 'pdf', id: `pdf-${l.id}`, title: `${l.title} — PDF`,
          subtitle: `${l.chapter?.subject?.title || ''} · ${l.chapter?.title || ''}`,
          navigate: () => navigate({ name: 'lecture', subjectSlug: l.chapter?.subject?.slug || '', chapterSlug: l.chapter?.slug || '', lectureId: l.id }),
        });
      }
    });

    return all;
  }, [lectures, chapters, subjects, query, navigate]);

  const filtered = filter === 'all' ? results : results.filter((r) => r.type === filter);
  const counts = {
    all: results.length,
    lecture: results.filter((r) => r.type === 'lecture').length,
    chapter: results.filter((r) => r.type === 'chapter').length,
    subject: results.filter((r) => r.type === 'subject').length,
    pdf: results.filter((r) => r.type === 'pdf').length,
  };

  const isLoading = lecLoading || chLoading || subLoading;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-3xl mx-auto px-4">
      <motion.div className="mt-4 mb-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-bold text-xl text-gray-900 mb-3">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" className="input-field pl-12 pr-10 text-base" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lectures, chapters, subjects, PDFs…" autoFocus />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {query.trim() && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(['all', 'lecture', 'chapter', 'subject', 'pdf'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {f === 'all' ? 'All' : f + 's'} {counts[f] > 0 && <span className="opacity-60">{counts[f]}</span>}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500 mb-3">{filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{query}"</p>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
          ) : filtered.length === 0 ? (
            <motion.div className="bg-white border border-gray-200 rounded-2xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No results found. Try a different search term.</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((r, i) => (
                  <motion.button key={r.id} onClick={r.navigate}
                    className="w-full bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 text-left hover:shadow-soft hover:border-primary-200 transition-all"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                    {r.thumbnail ? (
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={r.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        {r.type === 'chapter' ? <Layers className="w-5 h-5 text-gray-400" /> : r.type === 'subject' ? <BookOpen className="w-5 h-5 text-gray-400" /> : <FileText className="w-5 h-5 text-primary-400" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">{r.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{r.subtitle}</p>
                      {r.duration && <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5"><Clock className="w-3 h-3" /> {formatDuration(r.duration)}</div>}
                    </div>
                    <span className="badge bg-gray-100 text-gray-500 text-[9px] flex-shrink-0">{r.type}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {!query.trim() && !isLoading && (
        <motion.div className="bg-white border border-gray-200 rounded-2xl p-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Start typing to search across all lectures, chapters, subjects, and PDFs.</p>
        </motion.div>
      )}
    </div>
  );
}
