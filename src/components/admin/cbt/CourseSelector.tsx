"use client";

import { Check } from "lucide-react";
import type { Course } from "@/types/database";

interface CourseSelectorProps {
  courses: Course[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function CourseSelector({ courses, selectedId, onSelect, disabled }: CourseSelectorProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="course-selector"
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        Target Course <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          id="course-selector"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.title}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
