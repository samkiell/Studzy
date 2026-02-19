"use client";

import { useQuizContext } from "@/context/QuizContext";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, BrainCircuit, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ExplainPage() {
  const router = useRouter();
  const { session, questions: orderedQuestions, isHydrated } = useQuizContext();

  if (!isHydrated || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0B]">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentQuestion = orderedQuestions[session.currentIndex];
  
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0B] gap-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-gray-400">Question not found.</p>
        <Button variant="ghost" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const selectedOption = session.answers[currentQuestion.id];
  const isCorrect = selectedOption === currentQuestion.correct_option;

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0B]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Quiz
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-sm font-bold text-white">AI Explanation</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        {/* Question Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Question {session.currentIndex + 1}
            </span>
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
              {currentQuestion.topic || "General"}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-medium text-white/90 leading-tight">
            {currentQuestion.question_text}
          </h1>
        </div>

        {/* Options Feedback */}
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const isSelected = selectedOption === key;
            const isCorrectOption = key === currentQuestion.correct_option;
            
            let styles = "bg-white/2 border-white/5 text-gray-400";
            if (isCorrectOption) styles = "bg-green-500/10 border-green-500/20 text-green-400";
            else if (isSelected) styles = "bg-red-500/10 border-red-500/20 text-red-400";

            return (
              <div 
                key={key}
                className={`p-4 rounded-xl border flex items-start gap-4 ${styles}`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isCorrectOption ? 'bg-green-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-500'
                }`}>
                  {key.toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-sm">{value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:p-8 rounded-3xl border border-indigo-500/10 bg-indigo-500/[0.02] relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 blur-3xl rounded-full opacity-5 bg-indigo-500" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
              }`}>
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-white">
                  {isCorrect ? "Spot on!" : "Not quite right"}
                </h4>
                <p className="text-xs text-gray-400">
                  {isCorrect 
                    ? "Your logic holds up. Here's why this is correct:" 
                    : `The correct answer is ${currentQuestion.correct_option.toUpperCase()}. Let's break it down:`}
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {currentQuestion.explanation || "Detailed AI explanation logic would be integrated here, potentially streaming from a backend if not pre-provided in the question object."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <div className="flex items-center gap-2 text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Tutor Tip</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                Always look for keywords in the question that might hint at the intended behavior. For OAU exams, precision in terminology matters!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
