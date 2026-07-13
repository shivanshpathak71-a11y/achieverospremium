import { useState } from 'react';
import { Award, Loader as Loader2, RefreshCw, FileQuestion, CircleHelp as HelpCircle, Send, Sparkles } from 'lucide-react';

function PracticeQuizPanel({ lectureTitle }: { lectureTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ question: string; options: string[]; answer: number; explanation: string }[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true); setQuiz(null); setAnswers({}); setSubmitted(false);
    await new Promise((r) => setTimeout(r, 1200));
    setQuiz([
      { question: `What is the primary topic covered in "${lectureTitle}"?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0, explanation: 'This lesson focuses on the core topic.' },
      { question: 'Which of the following best describes a key concept?', options: ['A factual detail', 'A theoretical framework', 'A practical application', 'All of the above'], answer: 3, explanation: 'The lesson covers multiple aspects.' },
      { question: 'For exam preparation, what should you focus on?', options: ['Only memorize definitions', 'Practice MCQs and revise regularly', 'Skip revision', 'Only watch the video again'], answer: 1, explanation: 'Active practice and regular revision are most effective.' },
    ]);
    setLoading(false);
  };

  const score = quiz ? quiz.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  return (
    <div>
      {!quiz && !loading && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center mx-auto mb-3"><Award className="w-6 h-6 text-pink-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Generate a practice quiz to test your understanding.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><Award className="w-4 h-4" /> Generate Quiz</button>
        </div>
      )}
      {loading && <div className="flex flex-col items-center py-8 gap-3"><Loader2 className="w-8 h-8 text-pink-500 animate-spin" /><p className="text-sm text-gray-400">Generating quiz…</p></div>}
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
              {submitted && <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>}
            </div>
          ))}
          {!submitted ? <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < quiz.length} className="btn-primary w-full py-3 text-sm">Submit Quiz ({Object.keys(answers).length}/{quiz.length} answered)</button>
          : <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Try Again</button>}
        </div>
      )}
    </div>
  );
}

function McqPanel({ lectureTitle }: { lectureTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [mcqs, setMcqs] = useState<{ question: string; options: string[]; answer: number }[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true); setMcqs(null); setAnswers({}); setSubmitted(false);
    await new Promise((r) => setTimeout(r, 1200));
    setMcqs([
      { question: `Related to "${lectureTitle}": Which statement is correct?`, options: ['Statement A', 'Statement B', 'Both A and B', 'Neither A nor B'], answer: 2 },
      { question: 'Which is NOT related to this topic?', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], answer: 3 },
      { question: 'Choose the best answer.', options: ['First', 'Second', 'Third', 'Fourth'], answer: 0 },
      { question: 'Significance for exams?', options: ['Low', 'Medium', 'High', 'Not relevant'], answer: 2 },
      { question: 'Which article/provision is most relevant?', options: ['Article 1', 'Article 2', 'Article 3', 'Article 4'], answer: 1 },
    ]);
    setLoading(false);
  };

  const score = mcqs ? mcqs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0) : 0;

  return (
    <div>
      {!mcqs && !loading && (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3"><FileQuestion className="w-6 h-6 text-amber-500" /></div>
          <p className="text-sm text-gray-500 mb-4">Generate MCQs for practice on this topic.</p>
          <button onClick={generate} className="btn-primary text-sm py-2.5 px-5"><FileQuestion className="w-4 h-4" /> Generate MCQs</button>
        </div>
      )}
      {loading && <div className="flex flex-col items-center py-8 gap-3"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /><p className="text-sm text-gray-400">Generating MCQs…</p></div>}
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
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${showResult ? isCorrect ? 'bg-green-50 border-green-200 text-green-600' : isSelected ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-500' : isSelected ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      {opt}{showResult && isCorrect && ' ✓'}{showResult && isSelected && !isCorrect && ' ✗'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!submitted ? <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < mcqs.length} className="btn-primary w-full py-3 text-sm">Submit ({Object.keys(answers).length}/{mcqs.length})</button>
          : <button onClick={generate} className="btn-secondary w-full py-3 text-sm"><RefreshCw className="w-4 h-4" /> Try Again</button>}
        </div>
      )}
    </div>
  );
}

function DoubtPanel() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true); setAnswer(null);
    await new Promise((r) => setTimeout(r, 1200));
    const aiAnswer = `Great question! Based on the concepts covered in this lesson:\n\n• The key principle is understanding the fundamental relationship between the concepts discussed.\n• Think about how this topic connects to real-world applications and exam scenarios.\n• For deeper understanding, review related sections and practice similar questions.\n\nIf you need more specific clarification, try rephrasing your question.`;
    setAnswer(aiAnswer);
    setHistory([...history, { q: question, a: aiAnswer }]);
    setQuestion('');
    setLoading(false);
  };

  return (
    <div>
      <div className="text-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2"><HelpCircle className="w-6 h-6 text-purple-500" /></div>
        <p className="text-sm text-gray-500">Ask any doubt about this lesson.</p>
      </div>
      <div className="flex gap-2 mb-4">
        <input type="text" className="input-field flex-1" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Type your doubt here…" onKeyDown={(e) => e.key === 'Enter' && ask()} />
        <button onClick={ask} disabled={loading || !question.trim()} className="btn-primary px-4">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
      </div>
      {loading && <div className="flex flex-col items-center py-6 gap-3"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /><p className="text-sm text-gray-400">Thinking…</p></div>}
      {answer && !loading && (
        <div className="bg-gray-50 rounded-xl p-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-purple-500" /></div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</div>
          </div>
        </div>
      )}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Previous Questions</p>
          {history.slice(0, -1).reverse().map((h, i) => (
            <details key={i} className="bg-gray-50 rounded-xl p-3">
              <summary className="text-xs font-semibold text-gray-700 cursor-pointer">{h.q}</summary>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">{h.a}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export { PracticeQuizPanel, McqPanel, DoubtPanel };
