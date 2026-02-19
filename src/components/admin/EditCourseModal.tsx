"use client";

import { useState } from "react";
import type { Course } from "@/types/database";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createCourse, updateCourse } from "@/app/admin/actions";

interface EditCourseModalProps {
  course?: Course;
  onClose: () => void;
  onSave: (course: Course) => void;
}

export function EditCourseModal({ course, onClose, onSave }: EditCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCbt, setIsCbt] = useState(course?.is_cbt || false);
  
  const isEditing = !!course;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("is_cbt", String(isCbt));
    if (isEditing) {
      formData.append("id", course.id);
    }

    try {
      const result = isEditing 
        ? await updateCourse(formData) 
        : await createCourse(formData);

      if (result.success) {
        // Construct the course object for local state update
        const updatedCourse: Course = {
          id: isEditing ? course.id : (result.resourceId || Date.now().toString()),
          code: (formData.get("code") as string).toUpperCase(),
          title: formData.get("title") as string,
          description: formData.get("description") as string || null,
          created_at: isEditing ? course.created_at : new Date().toISOString(),
          is_cbt: isCbt,
        };
        onSave(updatedCourse);
        onClose();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {isEditing ? "Edit Course" : "Add New Course"}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  defaultValue={course?.code}
                  required
                  placeholder="e.g. CSC 201"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={course?.title}
                  required
                  placeholder="e.g. Computer Programming I"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={course?.description || ""}
                  rows={4}
                  placeholder="Tell students what they'll learn in this course..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <input
                  type="checkbox"
                  id="is_cbt"
                  checked={isCbt}
                  onChange={(e) => setIsCbt(e.target.checked)}
                  className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900"
                />
                <div>
                  <label htmlFor="is_cbt" className="block text-sm font-bold text-neutral-900 dark:text-white">
                    Enable CBT (Computer Based Test)
                  </label>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    If enabled, students can take practice exams for this course.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isEditing ? "Update Course" : "Create Course"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
