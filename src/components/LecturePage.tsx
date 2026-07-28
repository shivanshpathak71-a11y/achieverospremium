import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Play, CircleCheck as CheckCircle, Download,
  Clock, BookOpen, Award, Bookmark, Pin, FileQuestion, Radio,
  ExternalLink, ArrowRight, Layers, CheckCircle2, StickyNote,
  NotebookPen, Sigma, ClipboardList, FileEdit, Network, BookMarked
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useLectureById, useChaptersBySubjectSlug, useLectures, formatDuration } from '../lib/hooks';
import { getProgress, markCompleted, unmarkCompleted, isDownloaded } from '../lib/storage';
import { CinematicPlayer } from './CinematicPlayer';
import { PracticeQuizPanel, McqPanel, DoubtPanel } from './StudyTools';

const FALLBACK_THUMB = 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=400';

type Tab = 'description' | 'notes' | 'pdf' | 'quiz' | 'mcqs' | 'doubt' | 'resources';
type NoteCategory = 'all' | 'class-notes' | 'short-notes' | 'formula-sheet' | 'assignments' | 'practice-sheets' | 'mind-maps' | 'revision-notes';

const NOTE_CATEGORIES: { id: NoteCategory; label: string; icon: typeof BookOpen; keywords: string[] }[] = [
  { id: 'all', label: 'All Notes', icon: Layers, keywords: [] },
  { id: 'class-notes', label: 'Class Notes', icon: StickyNote, keywords: ['slide', 'class', 'annotation', 'lecture', 'simplification'] },
  { id: 'short-notes', label: 'Short Notes', icon: NotebookPen, keywords: ['concise', 'short', 'brief', 'summary'] },
  { id: 'formula-sheet', label: 'Formula Sheet', icon: Sigma, keywords: ['formula', 'formulae'] },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList, keywords: ['assignment', 'homework', 'task'] },
  { id: 'practice-sheets', label: 'Practice Sheets', icon: FileEdit, keywords: ['practice', 'exercise', 'worksheet'] },
  { id: 'mind-maps', label: 'Mind Maps', icon: Network, keywords: ['mind', 'map', 'mindmap'] },
  { id: 'revision-notes', label: 'Revision Notes', icon: BookMarked, keywords: ['revision', 'review', 'recall'] },
];

const TAB_CONFIG: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'description', label: 'Overview', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'quiz', label: 'Tests', icon: Award },
  { id: 'mcqs', label: 'MCQs', icon: FileQuestion },
  { id: 'doubt', label: 'Doubts', icon: FileQuestion },
  { id: 'resources', label: 'Resources', icon: Layers },
];

function getPdfList(lecture: { pdf_names: { name: string; url: string }[] | null; pdf_urls: string[] | null; pdf_url: string | null }) {
  if (lecture.pdf_names && lecture.pdf_names.length > 0) return lecture.pdf_names;
  if (lecture.pdf_urls && lecture.pdf_urls.length > 0) return lecture.pdf_urls.map((url, idx) => ({ name: url.split('/').pop()?.split('?')[0] || `PDF ${idx + 1}`, url }));
  if (lecture.pdf_url) return [{ name: lecture.pdf_url.split('/').pop()?.split('?')[0] || 'PDF 1', url: lecture.pdf_url }];
  return [];
}

function matchNoteCategory(pdfName: string, keywords: string[]): boolean {
  const lower = pdfName.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function LecturePage({ subjectSlug, chapterSlug, lectureId }: { subjectSlug: string; chapterSlug: string; lectureId: string }) {
  const { navigate } = useRouter();
  const { lecture, loading } = useLectureById(lectureId);
  const { chapters } = useChaptersBySubjectSlug(subjectSlug);
  const chapter = chapters.find((c) => c.slug === chapterSlug);
  const { lectures } = useLectures(chapter?.id);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [bookmarked, setBookmarked] = useState(false);
  const [completed, setCompleted] = useState(() => getProgress(lectureId)?.completed || false);
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('all');

  const currentIndex = useMemo(() => lectures.findIndex((l) => l.id === lectureId), [lectures, lectureId]);
  const nextLecture = currentIndex >= 0 && currentIndex < lectures.length - 1 ? lectures[currentIndex + 1] : null;
  const pdfList = lecture ? getPdfList(lecture) : [];

  const filteredNotes = useMemo(() => {
    if (noteCategory === 'all') return pdfList;
    const cat = NOTE_CATEGORIES.find((c) => c.id === noteCategory);
    if (!cat || cat.keywords.length === 0) return pdfList;
    return pdfList.filter((pdf) => matchNoteCategory(pdf.name, cat.keywords));
  }, [pdfList, noteCategory]);

  const availableCategories = useMemo(() => {
    return NOTE_CATEGORIES.filter((cat) => {
      if (cat.id === 'all') return pdfList.length > 0;
      return pdfList.some((pdf) => matchNoteCategory(pdf.name, cat.keywords));
    });
  }, [pdfList]);

  if (loading || !lecture) return (
    <div className="pt-20 max-w-5xl mx-auto px-4">
      <div className="aspect-video bg-gray-200 rounded-3xl animate-pulse mb-4" />
      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  return (
    <div className="pt-16 pb-24 lg:pb-12 max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ═══ LEFT: Lecture List Sidebar ═══ */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1">
          <div className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-500" /> {chapter?.title || 'Lessons'}
              </h3>
              <span className="text-xs text-gray-400 font-medium">{lectures.length} total</span>
            </div>
            <div className="space-y-2 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 scrollbar-thin">
              {lectures.map((lec) => {
                const prog = getProgress(lec.id);
                const pct = prog && lec.duration_seconds > 0 ? Math.min(100, (prog.position / lec.duration_seconds) * 100) : 0;
                const isCompleted = prog?.completed;
                const isDownloadedFlag = isDownloaded(lec.id);
                const isCurrent = lec.id === lectureId;
                return (
                  <button key={lec.id} onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: lec.id })}
                    className={`w-full bg-white border rounded-2xl p-3 flex items-center gap-3 text-left transition-all duration-300 ${isCurrent ? 'border-primary-300 ring-1 ring-primary-100 shadow-soft' : 'border-gray-200 hover:border-gray-300 hover:shadow-soft'}`}>
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={lec.thumbnail_url || FALLBACK_THUMB} alt="" loading="lazy" className="w-full h-full object-cover" />
                      {isCurrent ? (
                        <div className="absolute inset-0 bg-primary-600/40 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                      ) : isCompleted ? (
                        <div className="absolute inset-0 bg-success-600/50 flex items-center justify-center">
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
                        {lec.is_live && (
                          <span className="inline-flex items-center gap-0.5 bg-rose-500 text-white rounded px-1 py-0.5 text-[8px] font-bold tracking-wide flex-shrink-0">
                            <Radio className="w-2 h-2 text-white fill-white" /> LIVE
                          </span>
                        )}
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2">{lec.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {formatDuration(lec.duration_seconds)}</span>
                        {lec.is_live && lec.start_date && <span className="text-rose-500 font-medium">{new Date(lec.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        {(lec.pdf_urls || (lec.pdf_url ? [lec.pdf_url] : [])).length > 0 && <span className="flex items-center gap-0.5 text-primary-500"><FileText className="w-2.5 h-2.5" /> PDF</span>}
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

        {/* ═══ RIGHT: Main Content ═══ */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <CinematicPlayer
            lecture={lecture}
            onEnded={() => { markCompleted(lectureId); setCompleted(true); }}
            onNext={nextLecture ? () => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: nextLecture.id }) : undefined}
          />

          {/* Title + Actions */}
          <motion.div
            className="mt-5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                {chapter && (
                  <button onClick={() => navigate({ name: 'chapter', subjectSlug, chapterSlug })} className="inline-flex items-center gap-1.5 text-xs text-primary-600 font-semibold mb-1.5 hover:gap-2 transition-all">
                    <Layers className="w-3.5 h-3.5" /> {chapter.title}
                  </button>
                )}
                <h1 className="font-bold text-xl text-gray-900 leading-snug">{lecture.title}</h1>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setBookmarked(!bookmarked)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${bookmarked ? 'bg-primary-50 text-primary-500' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  aria-label="Bookmark">
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary-500' : ''}`} />
                </button>
                <button onClick={() => { if (completed) { unmarkCompleted(lectureId); setCompleted(false); } else { markCompleted(lectureId); setCompleted(true); } }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ${completed ? 'bg-success-50 text-success-600 hover:bg-success-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  <CheckCircle className="w-4 h-4" /> {completed ? 'Completed' : 'Mark Done'}
                </button>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-gray-400 mb-5">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDuration(lecture.duration_seconds)}</span>
              {lecture.teacher_name && <><span>·</span><span className="font-medium text-gray-500">{lecture.teacher_name}</span></>}
              {lecture.difficulty && <><span>·</span><span>{lecture.difficulty}</span></>}
              {pdfList.length > 0 && <><span>·</span><span className="flex items-center gap-1 text-primary-500"><FileText className="w-3.5 h-3.5" /> {pdfList.length} PDF</span></>}
              {lecture.class_tests && lecture.class_tests.length > 0 && <><span>·</span><span className="flex items-center gap-1 text-amber-500"><Award className="w-3.5 h-3.5" /> {lecture.class_tests.length} Test</span></>}
            </div>

            {/* ═══ Tab Bar ═══ */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
              <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                {TAB_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 py-3.5 text-xs font-semibold whitespace-nowrap px-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'}`}>
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                      {isActive && (
                        <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-400 rounded-full"
                          layoutId="activeTab" initial={false} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ═══ Tab Content ═══ */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>

                    {/* ─── Description ─── */}
                    {activeTab === 'description' && (
                      <div>
                        {lecture.description ? (
                          <p className="text-sm text-gray-700 leading-relaxed">{lecture.description}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No description added yet.</p>
                        )}
                        <div className="mt-5 p-5 bg-gradient-to-br from-primary-50/60 to-accent-50/40 rounded-2xl border border-primary-100">
                          <h4 className="text-xs font-bold text-primary-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Key Takeaways
                          </h4>
                          <ul className="space-y-2.5 text-sm text-gray-600">
                            {['Focus on key definitions and provisions.', 'Note important articles and their significance.', 'Practice previous year questions on this topic.'].map((t, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* ─── Notes (shows PDFs categorized as notes) ─── */}
                    {activeTab === 'notes' && (
                      <div>
                        {pdfList.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {availableCategories.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                  <button key={cat.id} onClick={() => setNoteCategory(cat.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${noteCategory === cat.id ? 'bg-primary-600 text-white shadow-soft' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                    <Icon className="w-3.5 h-3.5" /> {cat.label}
                                  </button>
                                );
                              })}
                            </div>
                            {filteredNotes.length > 0 ? (
                              <div className="space-y-3">
                                {filteredNotes.map((pdf, idx) => (
                                  <motion.div key={`${noteCategory}-${idx}`}
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50/40 to-white rounded-2xl border border-primary-100 hover:border-primary-200 hover:shadow-soft transition-all duration-300 group"
                                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                      <StickyNote className="w-5 h-5 text-primary-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{pdf.name}</p>
                                      <p className="text-xs text-gray-400 mt-0.5">Note PDF {filteredNotes.length > 1 ? `· ${idx + 1} of ${filteredNotes.length}` : ''}</p>
                                    </div>
                                    <button onClick={() => window.open(pdf.url, '_blank')} className="btn-primary text-xs py-2 px-3.5">View</button>
                                    <a href={pdf.url} download target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                      <Download className="w-4 h-4 text-gray-500" />
                                    </a>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                  <StickyNote className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-400">No {NOTE_CATEGORIES.find((c) => c.id === noteCategory)?.label.toLowerCase()} found for this lesson.</p>
                              </div>
                            )}
                          </>
                        ) : lecture.notes ? (
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lecture.notes}</div>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                              <StickyNote className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400">No notes attached to this lesson yet.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── PDF ─── */}
                    {activeTab === 'pdf' && (
                      pdfList.length > 0 ? (
                        <div className="space-y-3">
                          {pdfList.map((pdf, idx) => (
                            <motion.div key={idx}
                              className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-soft transition-all duration-300 group"
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                              <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5 text-primary-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{pdf.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">PDF Document {pdfList.length > 1 ? `· ${idx + 1} of ${pdfList.length}` : ''}</p>
                              </div>
                              <button onClick={() => window.open(pdf.url, '_blank')} className="btn-primary text-xs py-2 px-3.5">View</button>
                              <a href={pdf.url} download target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                                <Download className="w-4 h-4 text-gray-500" />
                              </a>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400">No PDF attached to this lesson.</p>
                        </div>
                      )
                    )}

                    {/* ─── Quiz / Tests ─── */}
                    {activeTab === 'quiz' && (
                      lecture.class_tests && lecture.class_tests.length > 0 ? (
                        <div className="space-y-3">
                          {lecture.class_tests.map((test, idx) => (
                            <motion.a key={idx} href={`https://selectionway.com/series/${test.seriesId}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50/50 to-white rounded-2xl border border-amber-100 hover:border-amber-200 hover:shadow-soft transition-all duration-300 group"
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05, duration: 0.25 }}>
                              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FileQuestion className="w-5 h-5 text-amber-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{test.name}</p>
                                {test.maxAttemptedLimit && <p className="text-xs text-gray-400 mt-0.5">Max {test.maxAttemptedLimit} attempts</p>}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 group-hover:gap-2.5 transition-all">
                                Take Test <ExternalLink className="w-3.5 h-3.5" />
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      ) : <PracticeQuizPanel lectureTitle={lecture.title} />
                    )}

                    {/* ─── MCQs ─── */}
                    {activeTab === 'mcqs' && <McqPanel lectureTitle={lecture.title} />}

                    {/* ─── Doubt ─── */}
                    {activeTab === 'doubt' && <DoubtPanel />}

                    {/* ─── Resources ─── */}
                    {activeTab === 'resources' && (
                      <div className="space-y-2.5">
                        <p className="text-sm text-gray-500 mb-4">All downloadable materials and links for this lecture.</p>
                        {pdfList.map((pdf, idx) => (
                          <a key={idx} href={pdf.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <FileText className="w-4 h-4 text-primary-500" />
                            <span className="text-sm text-gray-700 flex-1 truncate">{pdf.name}</span>
                            <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                          </a>
                        ))}
                        {lecture.class_tests && lecture.class_tests.map((test, idx) => (
                          <a key={`test-${idx}`} href={`https://selectionway.com/series/${test.seriesId}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-gray-700 flex-1 truncate">{test.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                          </a>
                        ))}
                        {pdfList.length === 0 && (!lecture.class_tests || lecture.class_tests.length === 0) && (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-400">No additional resources for this lecture.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Next lecture CTA */}
            {nextLecture && (
              <motion.button
                onClick={() => navigate({ name: 'lecture', subjectSlug, chapterSlug, lectureId: nextLecture.id })}
                className="mt-4 w-full bg-white border border-gray-200 rounded-3xl p-5 flex items-center justify-between hover:shadow-premium hover:border-primary-200 transition-all duration-300 group"
                whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 text-primary-500 fill-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Up Next</p>
                    <p className="text-sm font-bold text-gray-900">{nextLecture.title}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
