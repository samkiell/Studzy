"use client";

import { useState, useMemo } from "react";
import type { Course } from "@/types/database";
import { Search, Trash2, Edit3, Loader2, BookOpen, Plus } from "lucide-react";
import { EditCourseModal } from "./EditCourseModal";
import { Modal, useModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { deleteCourse } from "@/app/admin/actions";

interface AdminCourseTableProps {
  courses: Course[];
}

export function AdminCourseTable({
  courses: initialCourses,
}: AdminCourseTableProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteModal = useModal();

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      return (
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [courses, search]);

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    setLoadingId(courseToDelete.id);
    setDeleteError(null);

    try {
      const result = await deleteCourse(courseToDelete.id);

      if (result.success) {
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
        deleteModal.close();
        setCourseToDelete(null);
      } else {
        setDeleteError(result.message);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError("An unexpected error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Add */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search courses by code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>
        <Button 
          onClick={() => setIsAddingCourse(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Course Details</th>
                <th className="px-6 py-4 font-semibold text-neutral-900 dark:text-white">Description</th>
                <th className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const isLoading = loadingId === course.id;

                  return (
                    <tr
                      key={course.id}
                      className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                        isLoading ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {course.code}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate max-w-[250px]">
                              {course.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
                          {course.description || "No description provided"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingCourse(course)}
                            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setCourseToDelete(course);
                              setDeleteError(null);
                              deleteModal.open();
                            }}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {(editingCourse || isAddingCourse) && (
        <EditCourseModal
          course={editingCourse || undefined}
          onClose={() => {
            setEditingCourse(null);
            setIsAddingCourse(false);
          }}
          onSave={(updated) => {
            if (editingCourse) {
              setCourses((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              );
            } else {
              setCourses((prev) => [updated, ...prev]);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        type="error"
        title="Delete Course"
        description={`Are you sure you want to delete "${courseToDelete?.code}: ${courseToDelete?.title}"? This will fail if the course still has resources attached to it.`}
        footer={
          <div className="w-full space-y-4">
            {deleteError && (
              <p className="text-center text-sm font-medium text-red-600">
                {deleteError}
              </p>
            )}
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
                disabled={!!loadingId}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 hover:text-white border-transparent"
              >
                {loadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
}
