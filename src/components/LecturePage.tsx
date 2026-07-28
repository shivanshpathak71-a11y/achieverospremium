import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, Play, CircleCheck as CheckCircle, Download, Clock, BookOpen, Award, Bookmark, Pin, FileQuestion } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useLectureById, useChaptersBySubjectSlug, useLectures, formatDuration } from '../lib/hooks';
import { getProgress, markCompleted, isDownloaded } from '../lib/storage';
import { CinematicPlayer } from './CinematicPlayer';
import { PracticeQuizPanel, McqPanel, DoubtPanel } from './StudyTools';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

type Tab = 'description' | 'notes' | 'pdf' | 'quiz' | 'mcqs' | 'doubt' | 'resources';
type NoteCategory = 'class-notes' | 'short-notes' | 'formula-sheet' | 'assignments' | 'practice-sheets' | 'mind-maps' | 'revision-notes';

const NOTE_CATEGORIES: { id: NoteCategory; label: string; icon: typeof BookOpen }[] = [
  { id: 'class-notes', label: 'Class Notes', icon: BookOpen },
  { id: 'short-notes', label: 'Short Notes', icon: FileText },
  { id: 'formula-sheet', label: 'Formula Sheet', icon: FileQuestion },
  { id: 'assignments', label: 'Assignments', icon: Award },
  { id: 'practice-sheets', label: 'Practice Sheets', icon: FileText },
  { id: 'mind-maps', label: 'Mind Maps', icon: BookOpen },
  { id: 'revision-notes', label: 'Revision Notes', icon: FileText },
];

export function LecturePage({ subjectSlug, chapterSlug, lectureId }: { subjectSlug: string; chapterSlug: string; lectureId: string }) {
  const { navigate } = useRouter();
  const { lecture, loading } = useLectureById(lectureId);
  const { chapters } = useChaptersBySubjectSlug(subjectSlug);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures } = useLectures(chapter?.id);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [bookmarked, setBookmarked] = useState(false);
  const [completed, setCompleted] = useState(() => getProgress(lectureId)?.completed || false);
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('class-notes');

  const currentIndex = useMemo(() => lectures.findIndex((l) => l.id === lectureId), [lectures, lectureId]);
  const nextLecture = currentIndex >= 0 && currentIndex < lectures.length - 1 ? lectures[currentIndex + 1] : null;

  if (loading || !lecture) return <div className="pt-20 max-w-5xl mx-auto px-4"><div className="aspect-video bg-gray-200 rounded-2xl animate-pulse mb-4" /><div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" /></div>;

  return (
    <div className="pt-20 pb-24 lg:pb-12 max-w-5xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <CinematicPlayer
            lecture={lecture}
            onEnded={() => { markCompleted(lectureId); setCompleted(true); }}
            onNext={nextLecture ? () => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: nextLecture.id }) : undefined}
          />

          <div className="mt-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="font-bold text-lg text-gray-900">{lecture.title}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setBookmarked(!bookmarked)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Bookmark">
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'text-primary-500 fill-primary-500' : 'text-gray-400'}`} />
                </button>
                <button onClick={() => { markCompleted(lectureId); setCompleted(true); }} className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${completed ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <CheckCircle className="w-4 h-4" /> {completed ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(lecture.duration_seconds)}</span>
              {lecture.teacher_name && <span>· {lecture.teacher_name}</span>}
              {lecture.difficulty && <span>· {lecture.difficulty}</span>}
            </div>

            {/* Tabs */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex overflow-x-auto border-b border-gray-100">
                {(['description', 'notes', 'pdf', 'quiz', 'mcqs', 'doubt', 'resources'] as Tab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors whitespace-nowrap min-w-max px-4 ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50' : 'text-gray-500 hover:text-gray-900'}`}>
                    {tab === 'description' ? 'Description' : tab === 'notes' ? 'Notes' : tab === 'pdf' ? 'PDF' : tab === 'quiz' ? 'Practice Quiz' : tab === 'mcqs' ? 'MCQs' : tab === 'doubt' ? 'Doubt Section' : 'Resources'}
                  </button>
                ))}
              </div>
              <div className="p-5">
                {activeTab === 'description' && (
                  <div>
                    {lecture.description ? <p className="text-sm text-gray-700 leading-relaxed">{lecture.description}</p> : <p className="text-sm text-gray-400 italic">No description added yet.</p>}
                    <div className="mt-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                      <h4 className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-2">Important Points</h4>
                      <ul className="space-y-1.5 text-sm text-gray-600">
                        <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-primary-500 mt-2 flex-shrink-0" /> Focus on key definitions and provisions.</li>
                        <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-primary-500 mt-2 flex-shrink-0" /> Note important articles and their significance.</li>
                        <li className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-primary-500 mt-2 flex-shrink-0" /> Practice previous year questions on this topic.</li>
                      </ul>
                    </div>
                  </div>
                )}
                {activeTab === 'notes' && (
                  <div>
                    {/* Note category tabs */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {NOTE_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button key={cat.id} onClick={() => setNoteCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${noteCategory === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <Icon className="w-3 h-3" /> {cat.label}
                          </button>
                        );
                      })}
                    </div>
                    {lecture.notes ? <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lecture.notes}</div> : (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">No {NOTE_CATEGORIES.find((c) => c.id === noteCategory)?.label.toLowerCase()} attached to this lesson.</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'pdf' && (lecture.pdf_url ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <button onClick={() => window.open(lecture.pdf_url!, '_blank')} className="btn-primary text-sm py-2.5 px-4"><FileText className="w-4 h-4" /> View PDF</button>
                      <a href={lecture.pdf_url!} download target="_blank" rel="noreferrer" className="btn-secondary text-sm py-2.5 px-4"><Download className="w-4 h-4" /> Download PDF</a>
                    </div>
                    <p className="text-sm text-gray-500">Class PDF is available for this lecture.</p>
                  </div>
                ) : <div className="text-center py-8"><FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-400">No PDF attached to this lesson.</p></div>)}
                {activeTab === 'quiz' && <PracticeQuizPanel lectureTitle={lecture.title} />}
                {activeTab === 'mcqs' && <McqPanel lectureTitle={lecture.title} />}
                {activeTab === 'doubt' && <DoubtPanel />}
                {activeTab === 'resources' && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-3">Additional resources for this lecture.</p>
                    {lecture.pdf_url && <a href={lecture.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"><FileText className="w-4 h-4 text-primary-500" /><span className="text-sm text-gray-700">Lecture PDF</span></a>}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Award className="w-4 h-4 text-amber-500" /><span className="text-sm text-gray-700">Practice MCQs</span></div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><BookOpen className="w-4 h-4 text-blue-500" /><span className="text-sm text-gray-700">Related Chapters</span></div>
                  </div>
                )}
              </div>
            </div>

            {nextLecture && (
              <motion.button onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: nextLecture.id })} className="mt-4 w-full bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-premium hover:border-primary-200 transition-all"
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <div><p className="text-xs text-gray-400">Next Lesson</p><p className="text-sm font-semibold text-gray-900">{nextLecture.title}</p></div>
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center"><ChevronRight className="w-5 h-5 text-primary-500" /></div>
              </motion.button>
            )}
          </div>
        </div>

        {/* Sidebar: lecture list */}
        <div className="lg:w-80 flex-shrink-0">
          <h3 className="font-bold text-sm text-gray-900 mb-3">{chapter?.title || 'Lessons'}</h3>
          <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto">
            {lectures.map((lec) => {
              const prog = getProgress(lec.id);
              const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
              const isCompleted = prog?.completed;
              const isDownloadedFlag = isDownloaded(lec.id);
              const isCurrent = lec.id === lectureId;
              return (
                <button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lec.id })}
                  className={`w-full bg-white border rounded-xl p-3 flex items-center gap-3 text-left transition-all ${isCurrent ? 'border-primary-300 ring-1 ring-primary-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'}`}>
                  <div className="relative w-12 h-9 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                    {isCurrent ? (
                      <div className="absolute inset-0 bg-primary-600/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                      </div>
                    ) : isCompleted ? (
                      <div className="absolute inset-0 bg-success-600/40 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Play className="w-3 h-3 text-white fill-white" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {lec.is_pinned && <Pin className="w-3 h-3 text-primary-500 flex-shrink-0" />}
                      {lec.is_new && <span className="badge bg-primary-50 text-primary-600 border border-primary-200 text-[9px]">NEW</span>}
                      <p className="text-xs font-semibold text-gray-900 line-clamp-2">{lec.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {formatDuration(lec.duration_seconds)}</span>
                      {lec.pdf_url && <span className="flex items-center gap-0.5 text-primary-500"><FileText className="w-2.5 h-2.5" /> PDF</span>}
                      {isDownloadedFlag && <span className="flex items-center gap-0.5 text-success-500"><Download className="w-2.5 h-2.5" /> Saved</span>}
                    </div>
                    {pct > 0 && (
                      <div className="h-0.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isCompleted ? '#22c55e' : '#14b8a6' }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
