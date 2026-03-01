"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Lightbulb,
  ArrowLeft,
  Target,
} from "lucide-react";
import type {
  TheoryAttemptFeedback,
  TheoryExam,
  TheoryQuestion,
} from "@/types/theory";

interface TheoryResultViewProps {
  feedback: TheoryAttemptFeedback;
  exam: TheoryExam;
  questions: TheoryQuestion[];
  onBack: () => void;
}

export default function TheoryResultView({
  feedback,
  exam,
  questions,
  onBack,
}: TheoryResultViewProps) {
  const percentage = Math.round(
    (feedback.total_score / feedback.max_score) * 100
  );

  const getGradeColor = (pct: number) => {
    if (pct >= 70) return "text-emerald-400";
    if (pct >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getGradeBg = (pct: number) => {
    if (pct >= 70) return "bg-emerald-500/10 border-emerald-500/20";
    if (pct >= 50) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getGradeLabel = (pct: number) => {
    if (pct >= 90) return "Excellent";
    if (pct >= 70) return "Good";
    if (pct >= 50) return "Average";
    if (pct >= 30) return "Below Average";
    return "Needs Improvement";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Theory Exams
        </button>

        {/* Total Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`border rounded-2xl p-6 md:p-8 mb-8 ${getGradeBg(
            percentage
          )}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h1 className="text-xl md:text-2xl font-bold">{exam.title}</h1>
              </div>
              <p className="text-gray-400 text-sm">
                Graded on{" "}
                {new Date(feedback.graded_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-4xl md:text-5xl font-black ${getGradeColor(percentage)}`}>
                {feedback.total_score}
                <span className="text-lg text-gray-500">
                  /{feedback.max_score}
                </span>
              </p>
              <p className={`text-sm font-semibold mt-1 ${getGradeColor(percentage)}`}>
                {percentage}% — {getGradeLabel(percentage)}
              </p>
            </div>
          </div>

          {/* Score Bar */}
          <div className="mt-6 h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className={`h-full rounded-full ${
                percentage >= 70
                  ? "bg-emerald-500"
                  : percentage >= 50
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </div>
        </motion.div>

        {/* Per-Question Feedback */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Detailed Feedback
          </h2>

          {feedback.questions.map((qFeedback, idx) => {
            const question = questions.find(
              (q) => q.id === qFeedback.question_id
            );
            const qPercentage = Math.round(
              (qFeedback.score / qFeedback.max_marks) * 100
            );

            return (
              <motion.div
                key={qFeedback.question_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx + 1) * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        Q{qFeedback.question_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {question?.main_question || "Question not available"}
                    </p>
                  </div>
                  <div
                    className={`text-right shrink-0 px-4 py-2 rounded-xl border ${getGradeBg(
                      qPercentage
                    )}`}
                  >
                    <p
                      className={`text-xl font-black ${getGradeColor(
                        qPercentage
                      )}`}
                    >
                      {qFeedback.score}
                      <span className="text-xs text-gray-500">
                        /{qFeedback.max_marks}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Feedback Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Strengths */}
                  {qFeedback.strengths.length > 0 && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                          Strengths
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {qFeedback.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-300 leading-relaxed"
                          >
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {qFeedback.weaknesses.length > 0 && (
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                          Weaknesses
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {qFeedback.weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-300 leading-relaxed"
                          >
                            • {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Improvement */}
                {qFeedback.improvement && (
                  <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                        How to Improve
                      </p>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {qFeedback.improvement}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium text-sm hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Theory Exams
          </button>
        </div>
      </div>
    </div>
  );
}
