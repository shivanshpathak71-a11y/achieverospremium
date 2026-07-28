import { motion } from 'framer-motion';
import {
  Sparkles, Calendar, MessageSquare, StickyNote, FileQuestion,
  Brain, ListChecks, GraduationCap, Lightbulb, HelpCircle, Award,
} from 'lucide-react';
import { useState } from 'react';
import {
  AiChatPanel, StudyPlannerPanel, SummarizePanel, McqPanel,
  FlashcardPanel, RevisionPanel, ExplainPanel, SolvePyqPanel,
  PracticeQuizPanel, DoubtPanel,
} from './StudyTools';

type Tool = 'chat' | 'planner' | 'summarize' | 'mcqs' | 'quiz' | 'flashcards' | 'revision' | 'explain' | 'solve' | 'doubt';

const TOOLS: { id: Tool; label: string; desc: string; icon: typeof Sparkles; color: string; bg: string }[] = [
  { id: 'chat', label: 'AI Chat', desc: 'Ask anything about any subject', icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' },
  { id: 'planner', label: 'Study Planner', desc: 'Get a personalized daily schedule', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'summarize', label: 'Summarize', desc: 'Turn any lecture into concise notes', icon: StickyNote, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'explain', label: 'Explain Simply', desc: 'Understand concepts in simple language', icon: Lightbulb, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'quiz', label: 'Practice Quiz', desc: 'Test yourself with a 5-question quiz', icon: Award, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'mcqs', label: 'Generate MCQs', desc: 'Create MCQs from any topic', icon: FileQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Make flashcards for quick revision', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'revision', label: 'Revision Questions', desc: 'Daily spaced-repetition questions', icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'solve', label: 'Solve PYQs', desc: 'Step-by-step previous-year solutions', icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'doubt', label: 'Ask a Doubt', desc: 'Get your study doubts cleared', icon: HelpCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
];

export function AiAssistantPage() {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-24 lg:pb-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Study Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Gemini — your personal exam prep coach</p>
          </div>
        </div>
      </motion.div>

      {!activeTool ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                className="text-left p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-soft transition-all group">
                <div className={`w-10 h-10 rounded-xl ${tool.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${tool.color}`} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{tool.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tool.desc}</p>
              </button>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <button onClick={() => setActiveTool(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
            <span>← Back to all tools</span>
          </button>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            {activeTool === 'chat' && <AiChatPanel />}
            {activeTool === 'planner' && <StudyPlannerPanel />}
            {activeTool === 'summarize' && <SummarizePanel lectureTitle="General Topic" />}
            {activeTool === 'explain' && <ExplainPanel lectureTitle="General Topic" />}
            {activeTool === 'quiz' && <PracticeQuizPanel lectureTitle="General Topic" />}
            {activeTool === 'mcqs' && <McqPanel lectureTitle="General Topic" />}
            {activeTool === 'flashcards' && <FlashcardPanel lectureTitle="General Topic" />}
            {activeTool === 'revision' && <RevisionPanel lectureTitle="General Topic" />}
            {activeTool === 'solve' && <SolvePyqPanel />}
            {activeTool === 'doubt' && <DoubtPanel />}
          </div>
        </motion.div>
      )}
    </div>
  );
}
