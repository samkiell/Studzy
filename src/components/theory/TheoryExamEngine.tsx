"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, AlertCircle } from "lucide-react";
import TheoryQuestionCard from "./TheoryQuestionCard";
import TheoryNavigation from "./TheoryNavigation";
import TheoryResultView from "./TheoryResultView";
import { gradeTheoryExam, gradeTheoryQuestionStudyMode } from "@/app/actions/gradeTheoryExam";
import { saveTheoryProgress } from "@/app/(dashboard)/theory/actions";
import type {
  TheoryExam,
  TheoryQuestion,
  TheoryAttempt,
  TheoryAnswers,
  TheoryAttemptFeedback,
  TheoryQuestionFeedback,
} from "@/types/theory";

interface TheoryExamEngineProps {
  attempt: TheoryAttempt;
  exam: TheoryExam;
  questions: TheoryQuestion[];
}

export default function TheoryExamEngine({
  attempt,
  exam,
  questions,
}: TheoryExamEngineProps) {
  const router = useRouter();
  const isStudyMode = exam.exam_mode === "study";

  // If already completed, show results
  const [showResults, setShowResults] = useState(!!attempt.completed_at);
  const [feedback, setFeedback] = useState<TheoryAttemptFeedback | null>(
    attempt.feedback || null
  );

  // Answer state
  const [answers, setAnswers] = useState<TheoryAnswers>(
    (attempt.answers as TheoryAnswers) || {}
  );

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGradingQuestion, setIsGradingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Study mode: per-question feedback
  const [studyFeedback, setStudyFeedback] = useState<
    Record<string, TheoryQuestionFeedback>
  >({});

  // Selected questions (if max_selectable_questions is set)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(
    new Set(questions.map((q) => q.id))
  );

  const activeQuestions = exam.max_selectable_questions
    ? questions.filter((q) => selectedQuestionIds.has(q.id))
    : questions;

  const currentQuestion = activeQuestions[currentIndex];

  // Update answer for a question
  const updateAnswer = useCallback(
    (questionId: string, field: "main" | string, value: string, isSubQuestion = false) => {
      setAnswers((prev) => {
        const existing = prev[questionId] || { sub: {} };
        if (isSubQuestion) {
          return {
            ...prev,
            [questionId]: {
              ...existing,
              sub: { ...existing.sub, [field]: value },
            },
          };
        }
        return {
          ...prev,
          [questionId]: { ...existing, main: value },
        };
      });
    },
    []
  );

  // Toggle question selection (when max_selectable_questions is set)
  const toggleQuestionSelection = useCallback(
    (questionId: string) => {
      setSelectedQuestionIds((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) {
          next.delete(questionId);
        } else if (
          !exam.max_selectable_questions ||
          next.size < exam.max_selectable_questions
        ) {
          next.add(questionId);
        }
        return next;
      });
    },
    [exam.max_selectable_questions]
  );

  // Validate current question has at least some answer
  const isCurrentQuestionAnswered = (): boolean => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (!answer) return false;

    const hasMain = answer.main?.trim();
    const hasSub = Object.values(answer.sub).some((v) => v?.trim());
    return !!(hasMain || hasSub);
  };

  // Navigate
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < activeQuestions.length) {
      setCurrentIndex(index);
      setError(null);
    }
  };

  const goNext = () => {
    if (!isCurrentQuestionAnswered()) {
      setError("Please provide an answer before continuing.");
      return;
    }
    setError(null);

    // Auto-save progress
    saveTheoryProgress(attempt.id, answers).catch(console.error);

    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrevious = () => {
    if (currentIndex > 0) {
      setError(null);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Study mode: grade current question
  const handleStudyGrade = async () => {
    if (!currentQuestion || !isCurrentQuestionAnswered()) {
      setError("Please provide an answer before grading.");
      return;
    }

    setIsGradingQuestion(true);
    setError(null);

    try {
      const result = await gradeTheoryQuestionStudyMode({
        question_id: currentQuestion.id,
        exam_id: exam.id,
        answer: answers[currentQuestion.id] || { sub: {} },
      });

      setStudyFeedback((prev) => ({
        ...prev,
        [currentQuestion.id]: result,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to grade question");
    } finally {
      setIsGradingQuestion(false);
    }
  };

  // Final submission (exam mode)
  const handleFinalSubmit = async () => {
    // Validate all questions are answered
    const unanswered = activeQuestions.filter((q) => {
      const answer = answers[q.id];
      if (!answer) return true;
      const hasMain = answer.main?.trim();
      const hasSub = Object.values(answer.sub).some((v) => v?.trim());
      return !(hasMain || hasSub);
    });

    if (unanswered.length > 0) {
      setError(
        `Please answer all questions. Missing: Q${unanswered
          .map((q) => q.question_number)
          .join(", Q")}`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await gradeTheoryExam({
        attempt_id: attempt.id,
        exam_id: exam.id,
        answers,
      });

      setFeedback(result);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show results view
  if (showResults && feedback) {
    return (
      <TheoryResultView
        feedback={feedback}
        exam={exam}
        questions={activeQuestions}
        onBack={() => router.push("/theory")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white">
      <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{exam.title}</h1>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isStudyMode
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {isStudyMode ? "Study Mode" : "Exam Mode"}
              </span>
            </div>
          </div>

          {/* Instructions Banner */}
          {exam.instructions && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300">
              <p className="font-medium text-white mb-1">Instructions</p>
              <p>{exam.instructions}</p>
            </div>
          )}

          {/* Question Selection (if max_selectable_questions is set) */}
          {exam.max_selectable_questions && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
              <p className="text-sm text-amber-300 font-medium mb-2">
                Select {exam.max_selectable_questions} of{" "}
                {questions.length} questions to answer
              </p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedQuestionIds.has(q.id)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                    } ${
                      !selectedQuestionIds.has(q.id) &&
                      selectedQuestionIds.size >=
                        (exam.max_selectable_questions || 0)
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    disabled={
                      !selectedQuestionIds.has(q.id) &&
                      selectedQuestionIds.size >=
                        (exam.max_selectable_questions || 0)
                    }
                  >
                    Q{q.question_number}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedQuestionIds.size} / {exam.max_selectable_questions}{" "}
                selected
              </p>
            </div>
          )}
        </motion.header>

        {/* Current Question */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TheoryQuestionCard
                question={currentQuestion}
                answer={answers[currentQuestion.id] || { sub: {} }}
                onUpdateAnswer={updateAnswer}
                questionIndex={currentIndex}
                totalQuestions={activeQuestions.length}
                studyFeedback={studyFeedback[currentQuestion.id]}
                isGrading={isGradingQuestion}
                isStudyMode={isStudyMode}
                onGradeQuestion={handleStudyGrade}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Navigation */}
        <TheoryNavigation
          currentIndex={currentIndex}
          totalQuestions={activeQuestions.length}
          onPrevious={goPrevious}
          onNext={goNext}
          onGoTo={goToQuestion}
          onSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
          isStudyMode={isStudyMode}
          isLastQuestion={currentIndex === activeQuestions.length - 1}
          answeredQuestionIds={
            new Set(
              Object.entries(answers)
                .filter(([, a]) => {
                  const hasMain = a.main?.trim();
                  const hasSub = Object.values(a.sub).some((v) => v?.trim());
                  return hasMain || hasSub;
                })
                .map(([id]) => id)
            )
          }
          questionIds={activeQuestions.map((q) => q.id)}
        />
      </div>
    </div>
  );
}
