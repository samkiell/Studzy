"use client";

import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";

interface TheoryNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isStudyMode: boolean;
  isLastQuestion: boolean;
  answeredQuestionIds: Set<string>;
  questionIds: string[];
}

export default function TheoryNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onGoTo,
  onSubmit,
  isSubmitting,
  isStudyMode,
  isLastQuestion,
  answeredQuestionIds,
  questionIds,
}: TheoryNavigationProps) {
  return (
    <div className="mt-8 space-y-6">
      {/* Question Number Indicators */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {questionIds.map((id, index) => (
          <button
            key={id}
            onClick={() => onGoTo(index)}
            className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
              index === currentIndex
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : answeredQuestionIds.has(id)
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-gray-500 border border-white/10 hover:border-white/20"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isLastQuestion && !isStudyMode ? (
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                Submit Exam
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={currentIndex >= totalQuestions - 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
