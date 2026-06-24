"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Clock, 
  Send, 
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Question, Attempt, SubmitAnswer, isTheoryQuestion } from "@/types/cbt";
import { submitCbtAttempt } from "@/app/(dashboard)/cbt/actions";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { ResultSummary } from "./ResultSummary";
import { useQuizSession } from "@/hooks/useQuizSession";
import { quizSessionStorage } from "@/lib/quiz/quizSessionStorage";
import { ContinueQuizModal } from "./ContinueQuizModal";

interface CbtInterfaceProps {
  initialAttempt: Attempt;
  questions: Question[];
}

export default function CbtInterface({ initialAttempt, questions }: CbtInterfaceProps) {
  const router = useRouter();
  
  const {
    session,
    questions: orderedQuestions,
    isHydrated,
    hasExistingSession,
    setAnswer,
    setCurrentIndex: setSessionCurrentIndex,
    completeSession,
    clearSession,
    resumeExisting,
    startFresh
  } = useQuizSession({
    courseId: initialAttempt.course_id,
    questions,
    sessionId: initialAttempt.id
  });

  const [isSubmitted, setIsSubmitted] = useState(!!initialAttempt.completed_at);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialAttempt.time_limit_seconds || (initialAttempt.mode === 'exam' ? 1800 : 0)); 
  const [results, setResults] = useState<{ 
    score: number; 
    totalQuestions: number;
    topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
    questionsWithAnswers: any[];
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showJumpBar, setShowJumpBar] = useState(false);
  const [isCreatingAiSession, setIsCreatingAiSession] = useState(false);
  const [questionDurations, setQuestionDurations] = useState<Record<string, number>>({});
  // Theory answer state: { questionId: { main: string, sub: { label: value } } }
  const [theoryAnswers, setTheoryAnswers] = useState<Record<string, { main?: string; sub: Record<string, string> }>>({});

  const currentIndex = session?.currentIndex || 0;
  const answers = session?.answers || {};
  
  const currentQuestion = orderedQuestions[currentIndex];
  const isLastQuestion = currentIndex === orderedQuestions.length - 1;

  // Track time per question
  useEffect(() => {
    if (isSubmitted || !currentQuestion?.id) return;
    
    const interval = setInterval(() => {
      setQuestionDurations(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentQuestion?.id, isSubmitted]);

  // Handle already completed attempts
  useEffect(() => {
    if (initialAttempt.completed_at && !results && !isSubmitting) {
      const fetchExistingResults = async () => {
        setIsSubmitting(true);
        try {
          const res = await submitCbtAttempt({
            attemptId: initialAttempt.id,
            answers: [],
            durationSeconds: initialAttempt.duration_seconds || 0
          });
          // @ts-ignore
          setResults(res);
        } catch (error) {
          console.error("Failed to fetch existing results:", error);
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchExistingResults();
    }
  }, [initialAttempt.completed_at, initialAttempt.id, results, isSubmitting, questions]);

  // Timer logic for exam mode
  useEffect(() => {
    if (initialAttempt.mode === 'exam' && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [initialAttempt.mode, isSubmitted]);

  // Auto-submit when time runs out
  // We separate this from the timer effect to avoid stale closures over 'answers'
  useEffect(() => {
    if (initialAttempt.mode === 'exam' && timeLeft === 0 && !isSubmitted && !isSubmitting) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isSubmitted, isSubmitting, initialAttempt.mode]);

  // Keyboard Shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitted) return;

      // Ignore shortcuts if user is typing in an input, textarea or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Navigation: Left / Right arrows
      if (e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          setSessionCurrentIndex(currentIndex - 1);
          setShowExplanation(false);
        }
      } else if (e.key === "ArrowRight") {
        if (currentIndex < orderedQuestions.length - 1) {
          setSessionCurrentIndex(currentIndex + 1);
          setShowExplanation(false);
        }
      }

      // Option Selection: A, B, C, D
      if (currentQuestion && !isTheoryQuestion(currentQuestion)) {
        if (key === "a") {
          handleSelectOption("A");
        } else if (key === "b") {
          handleSelectOption("B");
        } else if (key === "c") {
          handleSelectOption("C");
        } else if (key === "d") {
          handleSelectOption("D");
        }
      }

      // Hotkey 'j' to skip/jump to a specific question number
      if (key === "j") {
        e.preventDefault();
        const numStr = prompt(`Enter question number to skip to (1-${orderedQuestions.length}):`);
        if (numStr) {
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num >= 1 && num <= orderedQuestions.length) {
            setSessionCurrentIndex(num - 1);
            setShowExplanation(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, orderedQuestions, isSubmitted, currentQuestion]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted || !currentQuestion) return;
    setAnswer(currentQuestion.id, option);
    if (initialAttempt.mode === 'study') {
      setShowExplanation(true);
    }
  };

  // Theory answer handlers
  const updateTheoryAnswer = (questionId: string, field: string, value: string, isSub = false) => {
    setTheoryAnswers(prev => {
      const existing = prev[questionId] || { sub: {} };
      if (isSub) {
        return { ...prev, [questionId]: { ...existing, sub: { ...existing.sub, [field]: value } } };
      }
      return { ...prev, [questionId]: { ...existing, main: value } };
    });
  };

  const nextQuestion = () => {
    if (currentIndex < orderedQuestions.length - 1) {
      setSessionCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setSessionCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;

    if (typeof window !== "undefined" && !navigator.onLine) {
      toast.error("You must be connected to the internet to submit your CBT exam.");
      return;
    }

    setIsSubmitting(true);

    const formattedAnswers: SubmitAnswer[] = Object.entries(answers).map(([id, option]) => ({
      question_id: id,
      selected_option: option,
      duration_seconds: questionDurations[id] || 0
    }));

    try {
      const res = await submitCbtAttempt({
        attemptId: initialAttempt.id,
        answers: formattedAnswers,
        durationSeconds: initialAttempt.mode === 'exam' ? ((initialAttempt.time_limit_seconds || 1800) - timeLeft) : 0,
        theoryAnswers: Object.keys(theoryAnswers).length > 0 ? theoryAnswers : undefined,
        questionDurations,
      });
      // @ts-ignore - The response object structure is correct now
      setResults(res);
      setIsSubmitted(true);
      clearSession();
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit exam attempt. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplainWithAi = async () => {
    router.push(`/cbt/${initialAttempt.id}/explain`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isSubmitted && results) {
    return (
      <ResultSummary 
        results={results} 
        courseCode={initialAttempt.course_code} 
      />
    );
  }

  // Count MCQ answers + theory answers
  const mcqAnsweredCount = Object.keys(answers).length;
  const theoryAnsweredCount = Object.values(theoryAnswers).filter(a => a.main?.trim() || Object.values(a.sub).some(v => v?.trim())).length;
  const answeredCount = mcqAnsweredCount + theoryAnsweredCount;
  const currentAccuracy = mcqAnsweredCount > 0 
    ? Math.round((orderedQuestions.filter(q => !isTheoryQuestion(q) && answers[q.id] === q.correct_option).length / mcqAnsweredCount) * 100) 
    : 0;

  if (!currentQuestion && !isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <ContinueQuizModal 
          isOpen={hasExistingSession}
          onContinue={resumeExisting}
          onStartNew={startFresh}
          lastStartedAt={quizSessionStorage.getSession(initialAttempt.course_id)?.startedAt}
        />
        {!hasExistingSession && (
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0A0A0B] overflow-hidden w-full max-w-full">
      <ContinueQuizModal 
        isOpen={hasExistingSession}
        onContinue={resumeExisting}
        onStartNew={startFresh}
        lastStartedAt={quizSessionStorage.getSession(initialAttempt.course_id)?.startedAt}
      />

      {/* ─── FIXED HEADER ─────────────────────────────────── */}
      <div className="shrink-0 z-40 border-b border-white/[0.06] bg-[#0A0A0B] w-full">
        {/* Course info row */}
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-md bg-indigo-500/10 shrink-0">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/80 font-mono uppercase tracking-wider leading-none">{initialAttempt.course_code}</p>
              <p className="text-xs text-gray-500 truncate max-w-[140px] sm:max-w-none leading-tight mt-0.5">
                {initialAttempt.course_title || "CBT Session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {initialAttempt.mode !== 'exam' && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 text-green-400">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-bold font-mono">{currentAccuracy}%</span>
              </div>
            )}

            {initialAttempt.mode === 'exam' && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${
                timeLeft < 300 
                  ? 'bg-red-500/10 text-red-400 animate-pulse' 
                  : 'bg-white/5 text-gray-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-bold font-mono">{formatTime(timeLeft)}</span>
              </div>
            )}

            {initialAttempt.mode === 'exam' && (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="text-xs font-bold uppercase tracking-wide text-red-500/70 hover:text-red-400 transition-colors ml-1"
              >
                {isSubmitting ? "..." : "End"}
              </button>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-[2px] bg-white/[0.04]">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / orderedQuestions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Jump bar toggle + collapsible grid */}
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setShowJumpBar(!showJumpBar)}
            className="w-full flex items-center justify-between py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
          >
            <span className="font-medium">Jump to question</span>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-mono text-[11px]">{currentIndex + 1}/{orderedQuestions.length}</span>
              {showJumpBar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          <AnimatePresence>
            {showJumpBar && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-center gap-1.5 pb-2.5">
                  {orderedQuestions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const hasAnswer = isTheoryQuestion(q) 
                      ? (theoryAnswers[q.id]?.main?.trim() || Object.values(theoryAnswers[q.id]?.sub || {}).some(v => v?.trim()))
                      : !!answers[q.id];
                    
                    let numBg = "bg-white/[0.04] text-gray-500 hover:bg-white/[0.08] hover:text-gray-300";
                    if (isCurrent) {
                      numBg = "bg-indigo-600 text-white font-bold";
                    } else if (hasAnswer) {
                      numBg = "bg-emerald-500/10 text-emerald-400";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          setSessionCurrentIndex(idx);
                          setShowExplanation(false);
                        }}
                        className={`w-7 h-7 rounded-md text-xs flex items-center justify-center transition-all active:scale-95 ${numBg}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── FIXED QUESTION TEXT ─────────────────────────── */}
      <div className="shrink-0 bg-[#0A0A0B] px-3 sm:px-4 pt-4 pb-3 border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Q{currentIndex + 1}
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="text-xs font-medium text-indigo-400/80 uppercase tracking-wide truncate">
              {currentQuestion.topic || "General"}
            </span>
            {currentQuestion.difficulty && (
              <>
                <span className="w-px h-3 bg-white/10" />
                <span className={`text-xs font-bold uppercase tracking-wide shrink-0 ${
                  currentQuestion.difficulty === 'easy'
                    ? 'text-emerald-400/70'
                    : currentQuestion.difficulty === 'hard'
                    ? 'text-red-400/70'
                    : 'text-amber-400/70'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </>
            )}
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-medium leading-snug text-white/90">
            {currentQuestion.question_text}
          </h2>
        </div>
      </div>

      {/* ─── SCROLLABLE OPTIONS AREA ──────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="space-y-3"
            >
              {/* Options / Theory */}
              {isTheoryQuestion(currentQuestion) ? (
                <div className="space-y-3">
                  {currentQuestion.sub_questions && currentQuestion.sub_questions.length > 0 ? (
                    currentQuestion.sub_questions.map((sq) => (
                      <div key={sq.label} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold mr-1.5">
                            {sq.label}
                          </span>
                          {sq.content}
                        </label>
                        <textarea
                          value={theoryAnswers[currentQuestion.id]?.sub[sq.label] || ""}
                          onChange={(e) => updateTheoryAnswer(currentQuestion.id, sq.label, e.target.value, true)}
                          placeholder={`Answer for part ${sq.label}...`}
                          rows={3}
                          disabled={isSubmitted}
                          className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2 outline-none focus:border-emerald-500/40 transition-colors text-white text-sm placeholder-gray-600 resize-y min-h-[60px]"
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Your Answer</label>
                      <textarea
                        value={theoryAnswers[currentQuestion.id]?.main || ""}
                        onChange={(e) => updateTheoryAnswer(currentQuestion.id, "main", e.target.value)}
                        placeholder="Write your answer here..."
                        rows={6}
                        disabled={isSubmitted}
                        className="w-full bg-[#111113] border border-white/[0.08] rounded-lg px-3 py-2 outline-none focus:border-emerald-500/40 transition-colors text-white placeholder-gray-600 resize-y min-h-[100px]"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = answers[currentQuestion.id] === key;
                    const isCorrect = key === currentQuestion.correct_option;
                    const hasAnswered = !!answers[currentQuestion.id];
                    
                    let buttonStyles = "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]";
                    if (isSelected) {
                      buttonStyles = "bg-indigo-500/10 border-indigo-500/40";
                    }
                    
                    if (initialAttempt.mode === 'study' && hasAnswered) {
                      if (isCorrect) {
                        buttonStyles = "bg-green-500/8 border-green-500/25";
                      } else if (isSelected) {
                        buttonStyles = "bg-red-500/8 border-red-500/25";
                      }
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectOption(key)}
                        disabled={(initialAttempt.mode === 'study' && hasAnswered) || isSubmitted}
                        className={`group p-3.5 sm:p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${buttonStyles}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-white/[0.05] text-gray-500'
                        }`}>
                          {key.toUpperCase()}
                        </div>
                        <span className="text-gray-200 text-sm sm:text-base leading-snug flex-1">{value}</span>
                        {initialAttempt.mode === 'study' && hasAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Study Mode Feedback */}
              {initialAttempt.mode === 'study' && answers[currentQuestion.id] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 sm:p-5 rounded-xl border ${
                    answers[currentQuestion.id] === currentQuestion.correct_option 
                      ? "bg-green-500/[0.04] border-green-500/10"
                      : "bg-red-500/[0.04] border-red-500/10"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {answers[currentQuestion.id] === currentQuestion.correct_option ? (
                          <Trophy className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span className="font-semibold text-sm sm:text-base text-white">
                          {answers[currentQuestion.id] === currentQuestion.correct_option ? "Correct!" : "Wrong"}
                        </span>
                        {answers[currentQuestion.id] !== currentQuestion.correct_option && (
                          <span className="text-xs sm:text-sm text-gray-400">
                            — Answer: {currentQuestion.correct_option?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={handleExplainWithAi}
                        disabled={isCreatingAiSession}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
                      >
                        {isCreatingAiSession ? (
                          <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        ) : <BrainCircuit className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Explain with AI</span>
                        <span className="sm:hidden">AI</span>
                      </button>
                    </div>

                    {currentQuestion.explanation && (
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pl-6">
                        {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── FIXED BOTTOM NAV ─────────────────────────────── */}
      <div className="shrink-0 z-40 border-t border-white/[0.06] bg-[#0A0A0B]/95 backdrop-blur-sm px-3 sm:px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button 
            onClick={prevQuestion} 
            disabled={currentIndex === 0}
            className="h-10 px-4 sm:px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all gap-1.5 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          <span className="text-xs text-gray-500 font-mono">
            {answeredCount}/{orderedQuestions.length} answered
          </span>

          {!isLastQuestion ? (
            <Button 
              onClick={nextQuestion} 
              className="h-10 px-4 sm:px-5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all gap-1.5 text-sm"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="h-10 px-5 sm:px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1.5 text-sm"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
