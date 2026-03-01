"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  ChevronRight,
  Clock,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { startTheoryAttempt } from "./actions";
import type { Course } from "@/types/database";
import type { TheoryExam, TheoryAttempt } from "@/types/theory";

interface TheoryDashboardProps {
  courses: Course[];
  exams: TheoryExam[];
  recentAttempts: TheoryAttempt[];
}

export default function TheoryDashboard({
  courses,
  exams,
  recentAttempts,
}: TheoryDashboardProps) {
  const router = useRouter();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const courseExams = exams.filter((e) => e.course_id === selectedCourseId);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedExamId("");
    setError(null);
  };

  const handleStart = async () => {
    if (!selectedExamId) {
      setError("Please select an exam to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await startTheoryAttempt(selectedExamId);
      router.push(`/theory/${session.attempt.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start theory exam");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 md:p-12 lg:p-24 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-medium mb-4">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span>Theory Exam Engine</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
            {selectedCourse
              ? `${selectedCourse.code} — ${selectedCourse.title}`
              : "Theory Exams"}
          </h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Practice written exams with AI-powered grading and detailed feedback.
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-8">
            {/* Course Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full bg-[#121214] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none text-white cursor-pointer"
              >
                <option value="" disabled>
                  Select a course...
                </option>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No theory courses available
                  </option>
                )}
              </select>
            </div>

            {/* Exam Selector */}
            {selectedCourseId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Select Exam
                  </label>
                  {courseExams.length > 0 ? (
                    <div className="space-y-3">
                      {courseExams.map((exam) => (
                        <button
                          key={exam.id}
                          onClick={() => setSelectedExamId(exam.id)}
                          className={`w-full p-4 rounded-xl border transition-all text-left ${
                            selectedExamId === exam.id
                              ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50"
                              : "bg-white/5 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <h3
                            className={`font-semibold text-sm md:text-base ${
                              selectedExamId === exam.id
                                ? "text-emerald-400"
                                : "text-white"
                            }`}
                          >
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {exam.exam_mode === "study"
                                ? "Study Mode"
                                : "Exam Mode"}
                            </span>
                            {exam.max_selectable_questions && (
                              <span className="text-xs text-gray-400">
                                Select {exam.max_selectable_questions} questions
                              </span>
                            )}
                          </div>
                          {exam.instructions && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                              {exam.instructions}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      No exams available for this course yet.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={isLoading || !selectedExamId}
              className="w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start Theory Exam
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </section>

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Attempts
            </h2>
            <div className="space-y-3">
              {recentAttempts.map((attempt) => {
                const exam = exams.find((e) => e.id === attempt.exam_id);
                const isCompleted = !!attempt.completed_at;
                const percentage = attempt.max_score
                  ? Math.round(
                      (attempt.total_score / attempt.max_score) * 100
                    )
                  : 0;

                return (
                  <button
                    key={attempt.id}
                    onClick={() => router.push(`/theory/${attempt.id}`)}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {exam?.title || "Unknown Exam"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              percentage >= 70
                                ? "text-emerald-400"
                                : percentage >= 50
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {attempt.total_score}/{attempt.max_score}
                          </span>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                      ) : (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                          In Progress
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
