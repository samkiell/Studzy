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
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Question, Attempt, SubmitAnswer } from "@/types/cbt";
import { submitCbtAttempt } from "@/app/(dashboard)/cbt/actions";
import { createExplanationSession } from "@/lib/cbt/ai-utils";
import { useRouter } from "next/navigation";

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
  const [timeLeft, setTimeLeft] = useState(initialAttempt.mode === 'exam' ? 1800 : 0); // 30 mins default
  const [results, setResults] = useState<{ score: number; totalQuestions: number } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCreatingAiSession, setIsCreatingAiSession] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

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
      selected_option: option
    }));

    try {
      const res = await submitCbtAttempt({
        attemptId: initialAttempt.id,
        answers: formattedAnswers,
        durationSeconds: initialAttempt.mode === 'exam' ? (1800 - timeLeft) : 0
      });
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 md:p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 md:w-10 md:h-10 text-indigo-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">CBT Completed!</h2>
          <p className="text-gray-400 mb-8">Your results have been processed.</p>
          
          <div className="flex flex-col sm:flex-row gap-8 md:gap-12 justify-center mb-10">
            <div>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider mb-1">Score</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{results.score} <span className="text-xl md:text-2xl text-gray-600">/ {results.totalQuestions}</span></p>
            </div>
          </div>

          <Button onClick={() => router.push('/cbt')} className="w-full sm:w-auto px-8 py-4">
            Back to CBT Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      {/* Top Header */}
      <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {initialAttempt.course_title && (
            <span className="px-3 py-1 md:px-4 md:py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-xs md:text-sm font-medium truncate max-w-[150px] md:max-w-none">
              {initialAttempt.course_title}
            </span>
          )}
          <span className="px-3 py-1 md:px-4 md:py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap">
            Q {currentIndex + 1} / {questions.length}
          </span>
          {initialAttempt.mode === 'exam' && (
            <div className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-lg border font-mono text-xs md:text-sm ${timeLeft < 300 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-300'}`}>
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full mb-8 md:mb-12 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Area */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">{currentQuestion.topic || "General"}</span>
              <h2 className="text-2xl md:text-3xl font-medium leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = answers[currentQuestion.id] === key;
                const isCorrect = key === currentQuestion.correct_option;
                
                let buttonStyles = "bg-white/5 border-white/10 hover:border-white/20";
                if (isSelected) {
                  buttonStyles = "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/50";
                }
                
                if (initialAttempt.mode === 'study' && isSelected) {
                  buttonStyles = isCorrect 
                    ? "bg-green-500/10 border-green-500/50 ring-1 ring-green-500/30"
                    : "bg-red-500/10 border-red-500/50 ring-1 ring-red-500/30";
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    disabled={initialAttempt.mode === 'study' && !!answers[currentQuestion.id]}
                    className={`p-4 md:p-6 rounded-2xl border transition-all text-left flex items-start gap-4 group ${buttonStyles}`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400'
                    }`}>
                      {key.toUpperCase()}
                    </span>
                    <span className="text-gray-200 mt-1 text-sm md:text-base">{value}</span>
                  </button>
                );
              })}
            </div>

            {/* Study Mode Feedback */}
            {initialAttempt.mode === 'study' && answers[currentQuestion.id] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border ${
                  answers[currentQuestion.id] === currentQuestion.correct_option 
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {answers[currentQuestion.id] === currentQuestion.correct_option ? (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-base md:text-lg">
                        {answers[currentQuestion.id] === currentQuestion.correct_option ? "Correct!" : "Incorrect"}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {answers[currentQuestion.id] === currentQuestion.correct_option 
                          ? "Great job! Move to the next question."
                          : `The correct answer is ${currentQuestion.correct_option.toUpperCase()}.`}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={handleExplainWithAi}
                    disabled={isCreatingAiSession}
                    className="w-full sm:w-auto gap-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 justify-center"
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

      {/* Navigation Controls */}
      <div className="mt-8 md:mt-16 flex items-center justify-between pb-8">
        <Button 
          variant="outline" 
          onClick={prevQuestion} 
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button 
          variant="outline" 
          onClick={nextQuestion} 
          disabled={isLastQuestion}
          className="gap-2 ml-auto"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>

      </div>
    </div>
  );
}
