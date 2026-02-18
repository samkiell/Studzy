"use client";

import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Send, 
  SkipForward,
  BrainCircuit,
  AlertCircle,
  XCircle,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Question, Attempt, SubmitAnswer } from "@/types/cbt";
import { submitCbtAttempt } from "@/app/(dashboard)/cbt/actions";
import { createExplanationSession } from "@/lib/cbt/ai-utils";
import { useRouter } from "next/navigation";

import { ResultSummary } from "./ResultSummary";

interface CbtInterfaceProps {
  initialAttempt: Attempt;
  questions: Question[];
}

export default function CbtInterface({ initialAttempt, questions }: CbtInterfaceProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialAttempt.time_limit_seconds || (initialAttempt.mode === 'exam' ? 1800 : 0)); 
  const [results, setResults] = useState<{ 
    score: number; 
    totalQuestions: number;
    topicStats: Record<string, { correct: number; total: number; avgTime: number }>;
    difficultyStats: Record<string, { correct: number; total: number }>;
    questionsWithAnswers: any[];
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCreatingAiSession, setIsCreatingAiSession] = useState(false);
  const [questionDurations, setQuestionDurations] = useState<Record<string, number>>({});

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Track time per question
  useEffect(() => {
    if (isSubmitted) return;
    
    const interval = setInterval(() => {
      setQuestionDurations(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentQuestion.id, isSubmitted]);

  // Timer logic for exam mode
  useEffect(() => {
    if (initialAttempt.mode === 'exam' && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [initialAttempt.mode, isSubmitted]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    if (initialAttempt.mode === 'study') {
      setShowExplanation(true);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
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
        durationSeconds: initialAttempt.mode === 'exam' ? ((initialAttempt.time_limit_seconds || 1800) - timeLeft) : 0
      });
      // @ts-ignore - The response object structure is correct now
      setResults(res);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplainWithAi = async () => {
    if (isCreatingAiSession) return;
    setIsCreatingAiSession(true);
    try {
      const { sessionId } = await createExplanationSession(
        currentQuestion,
        answers[currentQuestion.id]
      );
      
      // Navigate to chat with the created session
      router.push(`/studzyai/chat/${sessionId}`);
    } catch (error) {
      console.error("Failed to create AI session:", error);
    } finally {
      setIsCreatingAiSession(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isSubmitted && results) {
    return (
      <ResultSummary 
        results={results} 
        courseCode={initialAttempt.course_code} 
      />
    );
  }

  const answeredCount = Object.keys(answers).length;
  const currentAccuracy = answeredCount > 0 
    ? Math.round((questions.filter(q => answers[q.id] === q.correct_option).length / answeredCount) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-[#0A0A0B] flex flex-col overflow-hidden">
      {/* Top Header - Fixed */}
      <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white hidden sm:block">{initialAttempt.course_title || "CBT Session"}</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{initialAttempt.course_code} • {initialAttempt.mode} mode</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Accuracy</span>
              <div className="flex items-center gap-1 text-green-400">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs md:text-sm font-bold font-mono">{currentAccuracy}%</span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {initialAttempt.mode === 'exam' && (
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Timer</span>
                <div className={`flex items-center gap-1 font-mono text-xs md:text-sm font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-gray-300'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(timeLeft)}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Main Question Area - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-32">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest leading-none">
                      {currentQuestion.topic || "General"}
                    </span>
                  </div>
                  
                  {initialAttempt.mode === 'exam' && (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-500/80 hover:text-red-400 transition-colors"
                    >
                      {isSubmitting ? "..." : "Submit Exam"}
                    </button>
                  )}
                </div>
                <h2 className="text-xl md:text-3xl font-medium leading-tight text-white/90">
                  {currentQuestion.question_text}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isSelected = answers[currentQuestion.id] === key;
                  const isCorrect = key === currentQuestion.correct_option;
                  const hasAnswered = !!answers[currentQuestion.id];
                  
                  let buttonStyles = "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]";
                  if (isSelected) {
                    buttonStyles = "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50";
                  }
                  
                  if (initialAttempt.mode === 'study' && hasAnswered) {
                    if (isCorrect) {
                      buttonStyles = "bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20";
                    } else if (isSelected) {
                      buttonStyles = "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20";
                    }
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      disabled={(initialAttempt.mode === 'study' && hasAnswered) || isSubmitted}
                      className={`group p-4 md:p-5 rounded-2xl border transition-all text-left flex items-start gap-4 ${buttonStyles}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform group-active:scale-95 ${
                        isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-500 border border-white/5'
                      }`}>
                        {key.toUpperCase()}
                      </div>
                      <div className="flex-1 py-1">
                        <span className="text-gray-200 text-sm md:text-base leading-relaxed">{value}</span>
                        {initialAttempt.mode === 'study' && hasAnswered && isCorrect && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" />
                            Correct Answer
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Study Mode Feedback */}
              {initialAttempt.mode === 'study' && answers[currentQuestion.id] && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 md:p-8 rounded-3xl border overflow-hidden relative ${
                    answers[currentQuestion.id] === currentQuestion.correct_option 
                      ? "bg-green-500/5 border-green-500/10"
                      : "bg-red-500/5 border-red-500/10"
                  }`}
                >
                  {/* Decorative background blur */}
                  <div className={`absolute -right-10 -top-10 w-40 h-40 blur-3xl rounded-full opacity-10 ${
                    answers[currentQuestion.id] === currentQuestion.correct_option ? 'bg-green-500' : 'bg-red-500'
                  }`} />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {answers[currentQuestion.id] === currentQuestion.correct_option ? (
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Trophy className="w-5 h-5 text-green-500" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-lg text-white">
                            {answers[currentQuestion.id] === currentQuestion.correct_option ? "Correct!" : "U dey wrong"}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {answers[currentQuestion.id] === currentQuestion.correct_option 
                              ? "Excellent understanding. Keep the momentum going!"
                              : `The correct answer is ${currentQuestion.correct_option.toUpperCase()}. Review the explanation below.`}
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline"
                        onClick={handleExplainWithAi}
                        disabled={isCreatingAiSession}
                        size="sm"
                        className="hidden sm:flex gap-2 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10"
                      >
                        {isCreatingAiSession ? (
                          <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                        ) : <BrainCircuit className="w-4 h-4" />}
                        Explain with AI
                      </Button>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                      <p className="text-xs md:text-sm text-gray-300 leading-relaxed italic">
                      <span className="font-bold text-white mr-1">Explanation:</span>
                        {currentQuestion.explanation || "No explanation provided for this question."}
                      </p>
                    </div>

                    <Button 
                      variant="outline"
                      onClick={handleExplainWithAi}
                      disabled={isCreatingAiSession}
                      className="w-full sm:hidden gap-2 border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
                    >
                      {isCreatingAiSession ? (
                         <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                      ) : <BrainCircuit className="w-4 h-4" />}
                      Explain with AI
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="border-t border-white/5 bg-black/40 backdrop-blur-2xl px-4 py-4 md:py-6 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Button 
            onClick={prevQuestion} 
            disabled={currentIndex === 0}
            className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <Button 
                onClick={nextQuestion} 
                className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="h-12 px-8 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-500/20 gap-2"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                Final Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
