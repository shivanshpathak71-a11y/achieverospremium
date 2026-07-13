import { useState, useMemo } from 'react';
import { Search as SearchIcon, Play, Clock, ChevronRight } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useAllLectures, formatDuration } from '../lib/hooks';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

export function SearchPage() {
  const { navigate } = useRouter();
  const { lectures, loading } = useAllLectures();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return lectures.filter((l) => l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.chapter?.title.toLowerCase().includes(q) || l.chapter?.subject?.title.toLowerCase().includes(q));
  }, [lectures, query]);

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-3xl mx-auto px-4">
      <div className="mt-4 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" className="input-field pl-12 text-base" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lectures, chapters, subjects…" autoFocus />
        </div>
      </div>

      {query.trim() && (
        <div>
          <p className="text-sm text-gray-500 mb-3">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
          {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}</div> : results.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center"><SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No results found. Try a different search.</p></div>
          ) : (
            <div className="space-y-2">
              {results.map((lec) => (
                <button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug: lec.chapter?.subject?.slug || '', chapterSlug: lec.chapter?.slug || '', lectureId: lec.id })}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-3 text-left hover:shadow-md hover:border-gray-300 transition-all">
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-4 h-4 text-white fill-white" /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{lec.title}</p>
                    <p className="text-[11px] text-gray-400">{lec.chapter?.subject?.title} · {lec.chapter?.title}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5"><Clock className="w-3 h-3" /> {formatDuration(lec.duration_seconds)}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!query.trim() && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Start typing to search across all lectures.</p>
        </div>
      )}
    </div>
  );
}
