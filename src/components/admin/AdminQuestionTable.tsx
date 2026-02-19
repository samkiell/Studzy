"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteQuestion } from "@/app/admin/actions";
import { Question } from "@/types/cbt";

interface AdminQuestionTableProps {
  questions: Question[];
}

export function AdminQuestionTable({
  questions: initialQuestions,
}: AdminQuestionTableProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deleteModal = useModal();

  // Extract unique course codes for filter
  const courseCodes = useMemo(() => {
    // In strict mode, we might want to group by course_id, but here we just need a list of codes
    // We can assume questions have course_id, but maybe we want to filter by course_code if available
    // Let's check Question type. It has course_id. We might need to map ID to Code if data provided doesn't have code.
    // Ideally the parent component joins the course data.
    // For now let's assume the parent fetches relations and we can grab course_code from it?
    // Wait, the Question type in cbt.ts has course_id string. 
    // Realistically we need the course code for display.
    // Let's assume the parent passes extended questions or we just show course_id for now if that's all we have.
    // actually, let's update the type locally or expect an extended type.
    // For the immediate fix, I will allow filtering by course_id if that's what we have, 
    // BUT the prompt implies we want to see "JSON question I upload", which had course_code.
    // I'll stick to a simple filter for now.
    const codes = new Set(questions.map(q => q.course_id)); 
    return Array.from(codes);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.question_text.toLowerCase().includes(search.toLowerCase()) || 
                             q.correct_option.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = filterCourse === "all" || q.course_id === filterCourse;
      return matchesSearch && matchesCourse;
    });
  }, [questions, search, filterCourse]);

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    
    setLoadingId(questionToDelete.id);
    deleteModal.close();

    try {
      // We use the ID (UUID) for deletion
      const result = await deleteQuestion(questionToDelete.id);

      if (result.success) {
        setQuestions(prev => prev.filter(q => q.id !== questionToDelete.id));
      } else {
        alert(result.message); // Simple alert for error
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoadingId(null);
      setQuestionToDelete(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <option value="all">All Courses</option>
              {courseCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Question</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white w-32">Course</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                    No questions match your filters
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => {
                  const isLoading = loadingId === question.id;
                  const isExpanded = expandedId === question.id;

                  return (
                    <tr
                      key={question.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isLoading ? "opacity-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => toggleExpand(question.id)}
                            className="text-left font-medium text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 flex items-start gap-2"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4 mt-0.5 shrink-0" /> : <ChevronDown className="w-4 h-4 mt-0.5 shrink-0" />}
                            <span className="line-clamp-2 md:line-clamp-1">{question.question_text}</span>
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-2 pl-6 space-y-2 text-xs md:text-sm text-neutral-600 dark:text-neutral-400 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(question.options).map(([key, value]) => (
                                  <div 
                                    key={key} 
                                    className={`p-2 rounded border ${
                                      key === question.correct_option 
                                      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400" 
                                      : "bg-white border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700"
                                    }`}
                                  >
                                    <span className="font-bold mr-2">{key.toUpperCase()}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && (
                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-800 dark:text-blue-300">
                                  <span className="font-bold">Explanation:</span> {question.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 whitespace-nowrap">
                           {/* We display course ID for now, ideally we need to mapping or extended type */}
                           {question.course_id} 
                           {/* TODO: Fetch course code in parent */}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setQuestionToDelete(question);
                            deleteModal.open();
                          }}
                          disabled={isLoading}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Question"
        description="Are you sure you want to delete this question? This action cannot be undone."
        footer={
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              onClick={deleteModal.close}
              className="flex-1"
            >
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
