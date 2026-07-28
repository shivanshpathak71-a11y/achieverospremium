import { useState, useRef, useEffect } from 'react';
import {
  Award, Loader as Loader2, RefreshCw, FileQuestion, CircleHelp as HelpCircle,
  Send, Sparkles, AlertCircle, StickyNote, Lightbulb, Calendar,
  ListChecks, GraduationCap, Brain, MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react';
import { callAi, streamAi, type ChatMessage } from '../lib/ai';
import { Markdown } from './Markdown';

/* ──────────────────────────── Shared ──────────────────────────── */

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-700">Something went wrong</p>
        <p className="text-xs text-red-500 mt-1">{message}</p>
      </div>
    </div>
  );
}

function LoadingState({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex flex-col items-center py-10 gap-3">
      <Loader2 className={`w-8 h-8 ${color} animate-spin`} />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 rounded-2xl w-fit">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

/* ──────────────────────────── Quiz ──────────────────────────── */

export function PracticeQuizPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; answer: number; explanation: string }[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false); setError(null);
    const { data, error } = await callAi<{ question: string; options: string[]; answer: number; explanation: string }[]>({
      action: 'quiz', lectureTitle, chapterTitle, subjectTitle, count: 5,
    });
    if (error || !data) { setError(error || 'No quiz generated'); }
    else setQuiz(data);
    setLoading(false);
  };

  const score = quiz ? quiz.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  return (
    <div>
      {!quiz && !loading && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mx-auto mb-3"><Award className="w-6 h-6 text-pink-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Generate a practice quiz to test your understanding.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><Award className="w-4 h-4" /> Generate Quiz</button>
        </div>
      )}
      {loading && <LoadingState label="Generating quiz…" color="text-pink-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {quiz && (
        <div className="space-y-4">
          {submitted && <div className="bg-gray-50 rounded-xl p-4 text-center mb-4"><p className="text-2xl font-bold text-gray-900">{score} / {quiz.length}</p><p className="text-xs text-gray-400 mt-1">{score === quiz.length ? 'Perfect score!' : score >= quiz.length / 2 ? 'Good job!' : 'Keep practicing!'}</p></div>}
          {quiz.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold text-gray-900 mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = q.answer === oi;
                  const showResult = submitted && (isSelected || isCorrect);
                  return (
                    <button key={oi} onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })} disabled={submitted}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${showResult ? isCorrect ? 'bg-green-50 border-green-200 text-green-600' : isSelected ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500' : isSelected ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {opt}{showResult && isCorrect && ' ✓'}{showResult && isSelected && !isCorrect && ' ✗'}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>}
            </div>
          ))}
          {!submitted ? <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < quiz.length} className="btn-primary w-full py-3 text-sm">Submit Quiz ({Object.keys(answers).length}/{quiz.length} answered)</button>
          : <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Try Again</button>}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── MCQs ──────────────────────────── */

export function McqPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [mcqs, setMcqs] = useState<{ question: string; options: string[]; answer: number; explanation?: string }[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setMcqs(null); setAnswers({}); setSubmitted(false); setError(null);
    const { data, error } = await callAi<{ question: string; options: string[]; answer: number; explanation: string }[]>({
      action: 'mcqs', lectureTitle, chapterTitle, subjectTitle, count: 5,
    });
    if (error || !data) { setError(error || 'No MCQs generated'); }
    else setMcqs(data);
    setLoading(false);
  };

  const score = mcqs ? mcqs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  return (
    <div>
      {!mcqs && !loading && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3"><FileQuestion className="w-6 h-6 text-amber-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Generate MCQs for practice on this topic.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><FileQuestion className="w-4 h-4" /> Generate MCQs</button>
        </div>
      )}
      {loading && <LoadingState label="Generating MCQs…" color="text-amber-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {mcqs && (
        <div className="space-y-4">
          {submitted && <div className="bg-gray-50 rounded-xl p-4 text-center mb-4"><p className="text-2xl font-bold text-gray-900">{score} / {mcqs.length}</p><p className="text-xs text-gray-400 mt-1">{score === mcqs.length ? 'Perfect!' : 'Review and try again.'}</p></div>}
          {mcqs.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold text-gray-900 mb-3">Q{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect = q.answer === oi;
                  const showResult = submitted && (isSelected || isCorrect);
                  return (
                    <button key={oi} onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })} disabled={submitted}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${showResult ? isCorrect ? 'bg-green-50 border-green-200 text-green-600' : isSelected ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500' : isSelected ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {opt}{showResult && isCorrect && ' ✓'}{showResult && isSelected && !isCorrect && ' ✗'}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>}
            </div>
          ))}
          {!submitted ? <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < mcqs.length} className="btn-primary w-full py-3 text-sm">Submit ({Object.keys(answers).length}/{mcqs.length})</button>
          : <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Try Again</button>}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Doubt ──────────────────────────── */

export function DoubtPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle?: string; chapterTitle?: string; subjectTitle?: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question;
    setLoading(true); setAnswer(null); setStreamingText(''); setError(null);
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'doubt', lectureTitle, chapterTitle, subjectTitle, userMessage: q },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else {
      setAnswer(accumulated);
      setHistory([...history, { q, a: accumulated }]);
      setQuestion('');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-2"><HelpCircle className="w-6 h-6 text-teal-500" /></div>
        <p className="text-sm text-gray-500">Ask any doubt about this lesson.</p>
      </div>
      <div className="flex gap-2 mb-4">
        <input type="text" className="input-field flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your doubt here…" onKeyDown={(e) => e.key === 'Enter' && ask()} />
        <button onClick={ask} disabled={loading || !question.trim()} className="btn-primary px-4">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
      </div>
      {loading && !streamingText && <div className="mb-4"><TypingIndicator /></div>}
      {error && !loading && <ErrorBanner message={error} />}
      {(streamingText || answer) && !error && (
        <div className="bg-gray-50 rounded-xl p-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-teal-500" /></div>
            <div className="flex-1 text-sm text-gray-700 leading-relaxed">
              <Markdown content={answer || streamingText} />
            </div>
          </div>
        </div>
      )}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Previous Questions</p>
          {history.slice(0, -1).reverse().map((h, i) => (
            <details key={i} className="bg-gray-50 rounded-xl p-3">
              <summary className="text-xs font-semibold text-gray-700 cursor-pointer">{h.q}</summary>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed"><Markdown content={h.a} /></div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Summarize ──────────────────────────── */

export function SummarizePanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setNotes(null); setStreamingText(''); setError(null);
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'summarize', lectureTitle, chapterTitle, subjectTitle },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else setNotes(accumulated);
    setLoading(false);
  };

  return (
    <div>
      {!notes && !loading && !streamingText && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3"><StickyNote className="w-6 h-6 text-blue-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Get a concise summary of this lecture as study notes.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><StickyNote className="w-4 h-4" /> Summarize Lecture</button>
        </div>
      )}
      {loading && !streamingText && <LoadingState label="Summarizing lecture…" color="text-blue-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {(streamingText || notes) && !error && (
        <div>
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-blue-500" /></div>
              <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                <Markdown content={notes || streamingText} />
              </div>
            </div>
          </div>
          <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Flashcards ──────────────────────────── */

export function FlashcardPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<{ front: string; back: string }[] | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setCards(null); setFlipped({}); setError(null);
    const { data, error } = await callAi<{ front: string; back: string }[]>({
      action: 'flashcards', lectureTitle, chapterTitle, subjectTitle, count: 10,
    });
    if (error || !data) { setError(error || 'No flashcards generated'); }
    else setCards(data);
    setLoading(false);
  };

  return (
    <div>
      {!cards && !loading && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3"><Brain className="w-6 h-6 text-violet-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Generate flashcards from this lecture's content.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><Brain className="w-4 h-4" /> Generate Flashcards</button>
        </div>
      )}
      {loading && <LoadingState label="Creating flashcards…" color="text-violet-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {cards && (
        <div className="space-y-3">
          {cards.map((card, i) => (
            <button key={i} onClick={() => setFlipped({ ...flipped, [i]: !flipped[i] })}
              className="w-full text-left p-5 bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-100 hover:shadow-soft transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Card {i + 1}</span>
                {flipped[i] ? <ChevronUp className="w-3.5 h-3.5 text-violet-400" /> : <ChevronDown className="w-3.5 h-3.5 text-violet-400" />}
              </div>
              <p className="text-sm font-semibold text-gray-900">{flipped[i] ? card.back : card.front}</p>
              <p className="text-[10px] text-gray-400 mt-1">{flipped[i] ? 'Tap to see question' : 'Tap to reveal answer'}</p>
            </button>
          ))}
          <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Revision Questions ──────────────────────────── */

export function RevisionPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<{ question: string; answer: string; topic: string }[] | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setQuestions(null); setRevealed({}); setError(null);
    const { data, error } = await callAi<{ question: string; answer: string; topic: string }[]>({
      action: 'revision', lectureTitle, chapterTitle, subjectTitle, count: 5,
    });
    if (error || !data) { setError(error || 'No questions generated'); }
    else setQuestions(data);
    setLoading(false);
  };

  return (
    <div>
      {!questions && !loading && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><ListChecks className="w-6 h-6 text-emerald-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Create daily revision questions for spaced practice.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><ListChecks className="w-4 h-4" /> Generate Questions</button>
        </div>
      )}
      {loading && <LoadingState label="Creating revision questions…" color="text-emerald-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {questions && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px]">{q.topic}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{i + 1}. {q.question}</p>
              {!revealed[i] ? (
                <button onClick={() => setRevealed({ ...revealed, [i]: true })} className="text-xs text-emerald-600 font-medium mt-2 hover:underline">Show answer</button>
              ) : (
                <div className="text-sm text-gray-600 mt-2 leading-relaxed"><Markdown content={q.answer} /></div>
              )}
            </div>
          ))}
          <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Explain Simply ──────────────────────────── */

export function ExplainPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle: string; chapterTitle?: string; subjectTitle?: string }) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setExplanation(null); setStreamingText(''); setError(null);
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'explain', lectureTitle, chapterTitle, subjectTitle },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else setExplanation(accumulated);
    setLoading(false);
  };

  return (
    <div>
      {!explanation && !loading && !streamingText && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-3"><Lightbulb className="w-6 h-6 text-cyan-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Get this topic explained in simple, easy-to-understand language.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><Lightbulb className="w-4 h-4" /> Explain Simply</button>
        </div>
      )}
      {loading && !streamingText && <LoadingState label="Explaining in simple terms…" color="text-cyan-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {(streamingText || explanation) && !error && (
        <div>
          <div className="bg-gray-50 rounded-xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-cyan-500" /></div>
              <div className="flex-1 text-sm text-gray-700 leading-relaxed">
                <Markdown content={explanation || streamingText} />
              </div>
            </div>
          </div>
          <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Regenerate</button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Solve PYQ ──────────────────────────── */

export function SolvePyqPanel({ lectureTitle, chapterTitle, subjectTitle }: { lectureTitle?: string; chapterTitle?: string; subjectTitle?: string }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const solve = async () => {
    if (!question.trim() || loading) return;
    setLoading(true); setSolution(null); setStreamingText(''); setError(null);
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'solve', lectureTitle, chapterTitle, subjectTitle, userMessage: question },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else setSolution(accumulated);
    setLoading(false);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2"><GraduationCap className="w-6 h-6 text-orange-500" /></div>
        <p className="text-sm text-gray-500">Paste a previous-year question and get a step-by-step solution.</p>
      </div>
      <textarea className="input-field w-full mb-3" rows={4} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Paste your previous-year question here…" />
      <button onClick={solve} disabled={loading || !question.trim()} className="btn-primary w-full py-3 text-sm mb-4">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />} Solve Step by Step
      </button>
      {loading && !streamingText && <LoadingState label="Solving step by step…" color="text-orange-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {(streamingText || solution) && !error && (
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-orange-500" /></div>
            <div className="flex-1 text-sm text-gray-700 leading-relaxed">
              <Markdown content={solution || streamingText} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── AI Chat (general) ──────────────────────────── */

export function AiChatPanel({ subjectTitle }: { subjectTitle?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setInput(''); setLoading(true); setError(null); setStreamingText('');
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'chat', subjectTitle, messages: newMessages, userMessage: userMsg },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else {
      setMessages(prev => [...prev, { role: 'model', content: accumulated }]);
    }
    setStreamingText(''); setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2"><MessageSquare className="w-6 h-6 text-primary-500" /></div>
        <p className="text-sm text-gray-500">Ask anything about Reasoning, English, Math, GK, or any subject.</p>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 mb-4 max-h-96 overflow-y-auto scrollbar-thin">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">Start a conversation with your AI study assistant.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
              {m.role === 'user' ? <div className="whitespace-pre-wrap">{m.content}</div> : <Markdown content={m.content} />}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            {streamingText ? (
              <div className="max-w-[85%] rounded-2xl p-3.5 bg-gray-50 text-gray-700">
                <Markdown content={streamingText} />
              </div>
            ) : (
              <TypingIndicator />
            )}
          </div>
        )}
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex gap-2">
        <input type="text" className="input-field flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
      </div>
    </div>
  );
}

/* ──────────────────────────── Study Planner ──────────────────────────── */

export function StudyPlannerPanel() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState('');
  const [hours, setHours] = useState('');
  const [goal, setGoal] = useState('');

  const generate = async () => {
    setLoading(true); setPlan(null); setStreamingText(''); setError(null);
    const context = `Subjects: ${subjects || 'All subjects (Reasoning, English, Math, GK)'}. Available study time: ${hours || '4-6 hours per day'}. Exam goal: ${goal || 'SSC CGL/CHSL preparation'}.`;
    let accumulated = '';
    const { error: streamErr } = await streamAi(
      { action: 'plan', context },
      (chunk) => { accumulated += chunk; setStreamingText(accumulated); },
    );
    if (streamErr) { setError(streamErr); }
    else setPlan(accumulated);
    setLoading(false);
  };

  return (
    <div>
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2"><Calendar className="w-6 h-6 text-primary-500" /></div>
        <p className="text-sm text-gray-500">Get a personalized daily study schedule based on your goals.</p>
      </div>
      <div className="space-y-3 mb-4">
        <input className="input-field w-full" placeholder="Subjects to focus on (optional)" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
        <input className="input-field w-full" placeholder="Hours available per day (e.g. 5)" value={hours} onChange={(e) => setHours(e.target.value)} />
        <input className="input-field w-full" placeholder="Exam goal (e.g. SSC CGL, Stenographer)" value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary w-full py-3 text-sm mb-4">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} Create My Study Plan
      </button>
      {loading && !streamingText && <LoadingState label="Creating your study plan…" color="text-primary-500" />}
      {error && !loading && <ErrorBanner message={error} />}
      {(streamingText || plan) && !error && (
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-primary-500" /></div>
            <div className="flex-1 text-sm text-gray-700 leading-relaxed">
              <Markdown content={plan || streamingText} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
