"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { createExplanationSession } from "@/lib/cbt/ai-utils";
import { Question } from "@/types/cbt";
import { toast } from "react-hot-toast";

interface QuestionResult {
  id: string;
  question_id?: string;
  question_text: string;
  options: Record<string, string>;
  correct_option: string | null;
  selected_option: string | null;
  is_correct: boolean;
  duration_seconds: number;
  explanation: string | null;
  topic: string | null;
  ai_feedback?: {
    score: number;
    max_marks: number;
    strengths: string[];
    weaknesses: string[];
    improvement: string;
  } | null;
  theory_answer?: string | null;
}

interface ResultSummaryProps {
  results: {
    score: number;
    totalQuestions: number;
    topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
    questionsWithAnswers: QuestionResult[];
  };
  courseCode?: string;
}

export function ResultSummary({ results, courseCode }: ResultSummaryProps) {
  const router = useRouter();
  const reviewsRef = useRef<HTMLDivElement>(null);
  const percentage = Math.round((results.score / results.totalQuestions) * 100);
  const [loadingQuestionId, setLoadingQuestionId] = useState<string | null>(null);

  const scrollToReview = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExplainWithAi = async (question: QuestionResult) => {
    const qId = question.id || question.question_id || "";
    if (loadingQuestionId) return;
    setLoadingQuestionId(qId);
    try {
      // Create a compatible question object for the utility
      const compatibleQuestion = {
        ...question,
        id: qId,
        course_id: "", // Not strictly needed for prompt but required by type
        question_id: 0,
        difficulty: 'medium' as any,
        created_at: new Date().toISOString()
      } as Question;

      const { sessionId } = await createExplanationSession(
        compatibleQuestion,
        question.selected_option || ""
      );
      
      router.push(`/studzyai/chat/${sessionId}`);
    } catch (error: any) {
      console.error("Failed to create AI session:", error);
      toast.error(error.message || "Failed to start AI session. Please try again later.");
    } finally {
      setLoadingQuestionId(null);
    }
  };

  const getPercentageColor = (pct: number) => {
    if (pct >= 70) return "text-green-400";
    if (pct >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getMetricIcon = (topic: string) => {
    return <Target className="w-4 h-4 text-indigo-400" />;
  };

  // Detect if a question is theory (no options)
  const isTheory = (q: QuestionResult) => !q.options || Object.keys(q.options).length === 0;

  return (
    <div className="space-y-6 pb-12 px-2 md:px-0">
      {/* Header Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 md:p-10 text-center"
      >
        <div className="mx-auto w-14 h-14 md:w-16 md:h-16 mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <Trophy className="w-7 h-7 md:w-8 md:h-8 text-indigo-400" />
        </div>

        <h2 className="text-xl md:text-3xl font-bold mb-1">Exam Results</h2>
        <p className="text-[10px] text-gray-500 mb-6 font-mono uppercase tracking-widest">{courseCode || "CBT"} Session Completed</p>

        <div className="flex flex-row items-center justify-center gap-4 md:gap-12 mb-8">
          <div className="text-center min-w-[80px]">
            <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mb-1">Score</p>
            <p className={`text-2xl md:text-4xl font-bold ${getPercentageColor(percentage)}`}>
              {results.score}<span className="text-sm md:text-xl text-gray-600">/{results.totalQuestions}</span>
            </p>
          </div>
          
          <div className="w-px h-8 bg-white/10 md:h-12" />

          <div className="text-center min-w-[80px]">
            <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mb-1">Accuracy</p>
            <p className={`text-2xl md:text-4xl font-bold ${getPercentageColor(percentage)}`}>
              {percentage}%
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto sm:max-w-none">
          <Button onClick={() => router.push('/cbt')} size="sm" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 h-10 px-6 font-bold">
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={scrollToReview} className="w-full sm:w-auto border-white/10 hover:bg-white/5 h-10 px-6">
            Review Questions
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Topic Breakdown */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            <h3 className="text-base md:text-lg font-bold">Performance by Topic</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(results.topicStats).map(([topic, stats]) => {
              const topicPct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={topic} className="space-y-2">
                  <div className="flex justify-between text-[11px] md:text-sm">
                    <span className="text-gray-300 font-medium truncate max-w-[150px]">{topic}</span>
                    <span className="text-gray-400 shrink-0">{stats.correct}/{stats.total} • {stats.avgTime}s avg</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
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

        {/* Time Analysis */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6"
        >
          <div className="flex items-center gap-2.5 mb-5">
            <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
            <h3 className="text-base md:text-lg font-bold">Time Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-5">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mb-1">Avg per Question</p>
              <p className="text-xl md:text-2xl font-bold">
                {Math.round(results.questionsWithAnswers.reduce((acc, q) => acc + q.duration_seconds, 0) / (results.totalQuestions || 1))}s
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
              <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mb-1">Fastest Correct</p>
              <p className="text-xl md:text-2xl font-bold text-green-400">
                {Math.min(...results.questionsWithAnswers.filter(q => q.is_correct).map(q => q.duration_seconds)) === Infinity ? 0 : Math.min(...results.questionsWithAnswers.filter(q => q.is_correct).map(q => q.duration_seconds))}s
              </p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/5 text-indigo-300 text-[10px] md:text-xs border border-indigo-500/10">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold uppercase tracking-tight">Exam Tip</span>
                <span className="text-gray-400">• Focus on Accuracy</span>
             </div>
             <p className="text-[10px] md:text-xs text-gray-400 leading-relaxed px-1">
                You spent the most time on topics like <span className="text-indigo-400 font-medium">{Object.keys(results.topicStats)[0] || 'General'}</span>. Consider reviewing these areas to improve speed.
             </p>
          </div>
        </motion.div>
      </div>

      {/* Questions Review */}
      <div ref={reviewsRef} id="review" className="space-y-6 pt-4">
        <h3 className="text-base md:text-lg font-bold flex items-center gap-2.5 mb-2">
          <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
          Detailed Question Review
        </h3>

        <div className="space-y-4">
          {results.questionsWithAnswers.map((q, idx) => {
            const qId = q.id || q.question_id || `q-${idx}`;
            const theory = isTheory(q);

            return (
            <motion.div 
              key={qId}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className={`p-4 md:p-6 rounded-2xl border ${
                q.is_correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 md:gap-4">
                  <span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-bold text-xs md:text-sm shrink-0 shadow-sm ${
                    q.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm md:text-lg leading-relaxed text-gray-100">{q.question_text}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      <span className="text-[9px] md:text-xs font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                        {theory ? "Theory" : "MCQ"} • {q.topic || 'General'}
                      </span>
                      <span className="text-[9px] md:text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                        <Timer className="w-2.5 h-2.5" /> {q.duration_seconds}s
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {q.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                  )}
                  {!theory && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExplainWithAi(q)}
                      disabled={!!loadingQuestionId}
                      className="h-7 px-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                    >
                      {loadingQuestionId === qId ? (
                        <div className="w-3 h-3 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      EXPLAIN
                    </Button>
                  )}
                </div>
              </div>

              {/* MCQ: show options */}
              {!theory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
                  {Object.entries(q.options).map(([key, val]) => {
                    const isSelected = q.selected_option === key;
                    const isCorrectOpt = q.correct_option === key;
                    
                    let styles = "bg-white/5 border-white/10";
                    if (isCorrectOpt) styles = "bg-green-500/10 border-green-500/30 text-green-400";
                    else if (isSelected && !isCorrectOpt) styles = "bg-red-500/10 border-red-500/30 text-red-400";

                    return (
                      <div key={key} className={`p-3 md:p-4 rounded-xl border text-xs md:text-sm flex gap-3 transition-colors ${styles}`}>
                        <span className="font-bold opacity-50 shrink-0">{key.toUpperCase()}</span>
                        <span className="flex-1">{val}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Theory: show student's answer + AI feedback */}
              {theory && q.theory_answer && (
                <div className="mt-5 p-3.5 md:p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="font-bold text-gray-400 block mb-2 text-[10px] md:text-xs uppercase tracking-wider">Your Answer</span>
                  <p className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{q.theory_answer}</p>
                </div>
              )}

              {theory && q.ai_feedback && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`text-lg font-bold ${q.ai_feedback.score >= q.ai_feedback.max_marks * 0.7 ? 'text-green-400' : q.ai_feedback.score >= q.ai_feedback.max_marks * 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                      {q.ai_feedback.score}/{q.ai_feedback.max_marks}
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">AI Score</span>
                  </div>

                  {q.ai_feedback.strengths.length > 0 && (
                    <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                      <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">Strengths</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {q.ai_feedback.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}

                  {q.ai_feedback.weaknesses.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1.5">Weaknesses</p>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {q.ai_feedback.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {q.ai_feedback.improvement && (
                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">How to Improve</p>
                      <p className="text-xs text-gray-300">{q.ai_feedback.improvement}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Theory with no feedback (empty answer) */}
              {theory && !q.ai_feedback && (
                <div className="mt-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300">
                  No answer was submitted for this theory question.
                </div>
              )}

              {q.explanation && (
                <div className="mt-5 p-3.5 md:p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] md:text-sm text-gray-400 leading-relaxed italic border-l-2 border-l-indigo-500/40">
                  <span className="font-bold text-indigo-400 not-italic block mb-1 text-[10px] md:text-xs uppercase tracking-wider">Explanation</span>
                  {q.explanation}
                </div>
              )}
            </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
