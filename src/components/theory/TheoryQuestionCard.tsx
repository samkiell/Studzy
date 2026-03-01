"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle, Lightbulb, Loader2 } from "lucide-react";
import TheorySubQuestion from "./TheorySubQuestion";
import type { TheoryQuestion, TheoryQuestionFeedback } from "@/types/theory";

interface TheoryQuestionCardProps {
  question: TheoryQuestion;
  answer: { main?: string; sub: Record<string, string> };
  onUpdateAnswer: (
    questionId: string,
    field: string,
    value: string,
    isSubQuestion?: boolean
  ) => void;
  questionIndex: number;
  totalQuestions: number;
  studyFeedback?: TheoryQuestionFeedback;
  isGrading: boolean;
  isStudyMode: boolean;
  onGradeQuestion: () => void;
}

export default function TheoryQuestionCard({
  question,
  answer,
  onUpdateAnswer,
  questionIndex,
  totalQuestions,
  studyFeedback,
  isGrading,
  isStudyMode,
  onGradeQuestion,
}: TheoryQuestionCardProps) {
  const hasSubQuestions =
    question.sub_questions && question.sub_questions.length > 0;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-8 backdrop-blur-xl">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
            Q{question.question_number}
          </span>
          <span className="text-xs text-gray-500">
            {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-400">
          {question.marks} mark{question.marks !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Main Question Text */}
      <h2 className="text-base md:text-lg font-semibold text-white mb-6 leading-relaxed">
        {question.main_question}
      </h2>

      {/* Main Answer Textarea (only if no sub-questions, or as general answer) */}
      {!hasSubQuestions && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Answer
          </label>
          <textarea
            value={answer.main || ""}
            onChange={(e) =>
              onUpdateAnswer(question.id, "main", e.target.value)
            }
            placeholder="Write your answer here..."
            rows={8}
            className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-white placeholder-gray-600 resize-y min-h-[120px]"
          />
        </div>
      )}

      {/* Sub-Questions */}
      {hasSubQuestions && (
        <div className="space-y-5">
          {question.sub_questions!.map((sq) => (
            <TheorySubQuestion
              key={sq.id}
              subQuestion={sq}
              value={answer.sub[sq.label] || ""}
              onChange={(value) =>
                onUpdateAnswer(question.id, sq.label, value, true)
              }
            />
          ))}
        </div>
      )}

      {/* Study Mode: Grade Button */}
      {isStudyMode && !studyFeedback && (
        <div className="mt-6">
          <button
            onClick={onGradeQuestion}
            disabled={isGrading}
            className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGrading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Grading with AI...
              </>
            ) : (
              "Grade This Question"
            )}
          </button>
        </div>
      )}

      {/* Study Mode: Feedback Display */}
      {studyFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          {/* Score */}
          <div
            className={`p-4 rounded-xl border ${
              studyFeedback.score >= studyFeedback.max_marks * 0.7
                ? "bg-emerald-500/5 border-emerald-500/20"
                : studyFeedback.score >= studyFeedback.max_marks * 0.4
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            <p className="text-lg font-bold">
              <span
                className={
                  studyFeedback.score >= studyFeedback.max_marks * 0.7
                    ? "text-emerald-400"
                    : studyFeedback.score >= studyFeedback.max_marks * 0.4
                    ? "text-amber-400"
                    : "text-red-400"
                }
              >
                {studyFeedback.score}
              </span>
              <span className="text-gray-500">
                {" "}
                / {studyFeedback.max_marks}
              </span>
            </p>
          </div>

          {/* Strengths */}
          {studyFeedback.strengths.length > 0 && (
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">
                  Strengths
                </p>
              </div>
              <ul className="space-y-1">
                {studyFeedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {studyFeedback.weaknesses.length > 0 && (
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-red-400">
                  Weaknesses
                </p>
              </div>
              <ul className="space-y-1">
                {studyFeedback.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-300">
                    • {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement */}
          {studyFeedback.improvement && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                <p className="text-sm font-semibold text-indigo-400">
                  How to Improve
                </p>
              </div>
              <p className="text-sm text-gray-300">
                {studyFeedback.improvement}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
