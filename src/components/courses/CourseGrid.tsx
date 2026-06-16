"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { CourseCard } from "./CourseCard";
import type { Course } from "@/types/database";
import { getExamForCourse } from "@/lib/exam-schedule";

interface CourseGridProps {
  courses: Course[];
}

export function CourseGrid({ courses }: CourseGridProps) {
  const [query, setQuery] = useState("");

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!trimmedQuery) return courses;
    return courses.filter((course) => {
      const haystack = `${course.code} ${course.title} ${course.description ?? ""}`.toLowerCase();
      // normalize "CSC 202" / "csc202" so either spelling matches
      return (
        haystack.includes(trimmedQuery) ||
        haystack.replace(/\s+/g, "").includes(trimmedQuery.replace(/\s+/g, ""))
      );
    });
  }, [courses, trimmedQuery]);

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          No courses available
        </h3>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Check back later for new courses.
        </p>
      </div>
    );
  }

  const searchBar = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses by code or title…"
        aria-label="Search courses"
        className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-11 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (filtered.length === 0) {
    return (
      <div className="space-y-6">
        {searchBar}
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Search className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
            No courses match &ldquo;{query.trim()}&rdquo;
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Try a different course code or title.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();

  // Split into upcoming (or no date) and passed
  const upcoming: Course[] = [];
  const passed: Course[] = [];

  for (const course of filtered) {
    const exam = getExamForCourse(course.code);
    if (exam && new Date(exam.endTime) <= now) {
      passed.push(course);
    } else {
      upcoming.push(course);
    }
  }

  // Sort upcoming by exam start time (soonest first), courses with no exam go last
  upcoming.sort((a, b) => {
    const examA = getExamForCourse(a.code);
    const examB = getExamForCourse(b.code);
    if (!examA && !examB) return 0;
    if (!examA) return 1;
    if (!examB) return -1;
    return new Date(examA.startTime).getTime() - new Date(examB.startTime).getTime();
  });

  return (
    <div className="space-y-6">
      {searchBar}

      {/* Upcoming courses */}
      {upcoming.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((course) => (
            <CourseCard key={course.id} course={course} isPassed={false} now={now} />
          ))}
        </div>
      )}

      {/* Passed courses section */}
      {passed.length > 0 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            Exams Done
            <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {passed.map((course) => (
              <CourseCard key={course.id} course={course} isPassed={true} now={now} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
