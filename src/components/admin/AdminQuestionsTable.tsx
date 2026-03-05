"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Gauge,
  Layers,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteQuestion } from "@/app/admin/actions";

interface AdminQuestion {
  id: string;
  course_code: string;
  question_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_option: string | null;
  explanation: string | null;
  topic: string | null;
  difficulty: string | null;
  question_type: string | null;
  created_at: string;
}

interface AdminQuestionsTableProps {
  questions: AdminQuestion[];
}

const ITEMS_PER_PAGE = 25;

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function AdminQuestionsTable({ questions: initialQuestions }: AdminQuestionsTableProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(0);
  const [questionToDelete, setQuestionToDelete] = useState<AdminQuestion | null>(null);
  const deleteModal = useModal();

  const courseCodes = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.course_code))).sort();
  }, [questions]);

  const topics = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.topic || "General"))).sort();
  }, [questions]);

  const difficulties = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.difficulty || "medium")));
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.question_text.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = filterCourse === "all" || q.course_code === filterCourse;
      const matchesDifficulty = filterDifficulty === "all" || (q.difficulty || "medium") === filterDifficulty;
      const matchesTopic = filterTopic === "all" || (q.topic || "General") === filterTopic;
      const isTheory = !q.options || Object.keys(q.options).length === 0 || q.question_type === "theory";
      const matchesType =
        filterType === "all" ||
        (filterType === "mcq" && !isTheory) ||
        (filterType === "theory" && isTheory);
      return matchesSearch && matchesCourse && matchesDifficulty && matchesTopic && matchesType;
    });
  }, [questions, search, filterCourse, filterDifficulty, filterTopic, filterType]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useMemo(() => setPage(0), [search, filterCourse, filterDifficulty, filterTopic, filterType]);

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setLoadingId(questionToDelete.id);
    deleteModal.close();

    try {
      const result = await deleteQuestion(questionToDelete.id);
      if (result.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionToDelete.id));
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoadingId(null);
      setQuestionToDelete(null);
    }
  };

  const isTheoryQuestion = (q: AdminQuestion) =>
    !q.options || Object.keys(q.options).length === 0 || q.question_type === "theory";

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Course filter */}
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Courses</option>
              {courseCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Difficulties</option>
              {difficulties.map((d) => (
                <option key={d} value={d} className="capitalize">{d}</option>
              ))}
            </select>
          </div>
          {/* Topic filter */}
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {/* Type filter */}
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="theory">Theory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
        <span>
          Showing {paginatedQuestions.length} of {filteredQuestions.length} questions
          {filteredQuestions.length !== questions.length && ` (${questions.length} total)`}
        </span>
        {totalPages > 1 && (
          <span>Page {page + 1} of {totalPages}</span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white w-8">#</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">Question</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">Course</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">Topic</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">Difficulty</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {paginatedQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-neutral-300" />
                      <p>No questions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQuestions.map((q, idx) => {
                  const isLoading = loadingId === q.id;
                  const isTheory = isTheoryQuestion(q);
                  const difficulty = q.difficulty || "medium";

                  return (
                    <tr
                      key={q.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isLoading ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-neutral-400 text-xs font-mono">
                        {page * ITEMS_PER_PAGE + idx + 1}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-neutral-900 dark:text-white text-sm truncate" title={q.question_text}>
                          {q.question_text.length > 100
                            ? q.question_text.slice(0, 100) + "..."
                            : q.question_text}
                        </p>
                        {q.correct_option && (
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">
                            Answer: {q.correct_option.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          {q.course_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-neutral-500">{q.topic || "General"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                            difficultyColors[difficulty] || difficultyColors.medium
                          }`}
                        >
                          {difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            isTheory
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {isTheory ? "Theory" : "MCQ"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setQuestionToDelete(q);
                            deleteModal.open();
                          }}
                          disabled={isLoading}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show pages around current page
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === pageNum
                      ? "bg-primary-600 text-white"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Question"
        description={`Are you sure you want to delete this question? This action cannot be undone.${
          questionToDelete ? `\n\n"${questionToDelete.question_text.slice(0, 80)}..."` : ""
        }`}
        footer={
          <div className="flex w-full gap-3">
            <Button variant="outline" onClick={deleteModal.close} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent"
            >
              Delete
            </Button>
          </div>
        }
      />
    </div>
  );
}
