"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  Clock, 
  Target, 
  ChevronRight, 
  Trophy,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Timer,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface QuestionResult {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string;
  selected_option: string;
  is_correct: boolean;
  duration_seconds: number;
  explanation: string | null;
  topic: string | null;
  difficulty: string;
}

interface ResultSummaryProps {
  results: {
    score: number;
    totalQuestions: number;
    topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
    difficultyStats: Record<string, { correct: number; total: number }>;
    questionsWithAnswers: QuestionResult[];
  };
  courseCode?: string;
}

export function ResultSummary({ results, courseCode }: ResultSummaryProps) {
  const router = useRouter();
  const percentage = Math.round((results.score / results.totalQuestions) * 100);

  const getPercentageColor = (pct: number) => {
    if (pct >= 70) return "text-green-400";
    if (pct >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getMetricIcon = (topic: string) => {
    return <Target className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 text-center backdrop-blur-md"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />
        
        <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-indigo-500/10 flex items-center justify-center ring-4 ring-indigo-500/20">
          <Trophy className="w-12 h-12 text-indigo-400" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-2">Exam Results</h2>
        <p className="text-gray-400 mb-8 font-mono">{courseCode || "CBT"} Session Completed</p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Score</p>
            <p className={`text-5xl font-black ${getPercentageColor(percentage)}`}>
              {results.score} <span className="text-2xl text-gray-600">/ {results.totalQuestions}</span>
            </p>
          </div>
          
          <div className="w-px h-12 bg-white/10 hidden md:block" />

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Accuracy</p>
            <p className={`text-5xl font-black ${getPercentageColor(percentage)}`}>
              {percentage}%
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => router.push('/cbt')} className="bg-indigo-600 hover:bg-indigo-700">
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}>
            Review Questions
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topic Breakdown */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Performance by Topic</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(results.topicStats).map(([topic, stats]) => {
              const topicPct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={topic} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">{topic}</span>
                    <span className="text-gray-400">{stats.correct}/{stats.total} • {stats.avgTime}s avg</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        topicPct >= 70 ? 'bg-green-500' : topicPct >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${topicPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Difficulty Breakdown */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Time Analysis</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-gray-500 uppercase mb-1">Avg per Question</p>
              <p className="text-2xl font-bold">
                {Math.round(results.questionsWithAnswers.reduce((acc, q) => acc + q.duration_seconds, 0) / results.totalQuestions)}s
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-xs text-gray-500 uppercase mb-1">Fastest Correct</p>
              <p className="text-2xl font-bold text-green-400">
                {Math.min(...results.questionsWithAnswers.filter(q => q.is_correct).map(q => q.duration_seconds)) || 0}s
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 font-mono text-xs">
             <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/5 text-indigo-300">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Exam Tip</span>
                <span>Focus on Accuracy</span>
             </div>
             <p className="text-gray-400 leading-relaxed px-1">
                You spent the most time on topics like {Object.keys(results.topicStats)[0]}. Consider reviewing these areas to improve speed.
             </p>
          </div>
        </motion.div>
      </div>

      {/* Questions Review */}
      <div id="review" className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          Detailed Question Review
        </h3>

        <div className="space-y-4">
          {results.questionsWithAnswers.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-6 rounded-2xl border ${
                q.is_correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    q.is_correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg leading-relaxed">{q.question_text}</h4>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter">Topic: {q.topic || 'General'}</span>
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-tighter flex items-center gap-1">
                        <Timer className="w-3 h-3" /> {q.duration_seconds}s
                      </span>
                    </div>
                  </div>
                </div>
                {q.is_correct ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" /> : <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {Object.entries(q.options).map(([key, val]) => {
                  const isSelected = q.selected_option === key;
                  const isCorrect = q.correct_option === key;
                  
                  let styles = "bg-white/5 border-white/10";
                  if (isCorrect) styles = "bg-green-500/20 border-green-500/50 text-green-300";
                  else if (isSelected && !isCorrect) styles = "bg-red-500/20 border-red-500/50 text-red-300";

                  return (
                    <div key={key} className={`p-4 rounded-xl border text-sm flex gap-3 ${styles}`}>
                      <span className="font-bold opacity-50">{key}</span>
                      <span>{val}</span>
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 leading-relaxed italic">
                  <span className="font-bold text-indigo-400 not-italic block mb-1">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
