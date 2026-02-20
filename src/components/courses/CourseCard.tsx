import Link from "next/link";
import { SmartLink } from "@/components/ui/SmartLink";
import { CheckCircle2, Calendar, Clock } from "lucide-react";
import type { Course } from "@/types/database";
import { getExamForCourse } from "@/lib/exam-schedule";

interface CourseCardProps {
  course: Course;
  isPassed?: boolean;
  now?: Date;
}

export function CourseCard({ course, isPassed = false, now = new Date() }: CourseCardProps) {
  const exam = getExamForCourse(course.code);

  // Determine if exam is happening today / very soon
  const isSoon = exam && !isPassed
    ? (() => {
        const diff = new Date(exam.startTime).getTime() - now.getTime();
        return diff > 0 && diff < 1000 * 60 * 60 * 24;
      })()
    : false;

  return (
    <div className={`relative group/card transition-opacity ${isPassed ? "opacity-60" : ""}`}>
      <SmartLink href={`/course/${course.code}`}>
        <div className={`h-full rounded-xl border bg-white p-6 transition-all dark:bg-neutral-900 ${
          isPassed
            ? "border-neutral-200 dark:border-neutral-800"
            : isSoon
            ? "border-primary-300 shadow-md shadow-primary-500/10 dark:border-primary-700"
            : "border-neutral-200 hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:hover:border-primary-700"
        }`}>
          {/* Header row: code badge + status badge + arrow */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-medium ${
                isPassed
                  ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              }`}>
                {course.code}
              </span>

              {/* Status badge */}
              {isPassed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Passed
                </span>
              ) : isSoon ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse">
                  ⚡ Today
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <svg
                className="h-5 w-5 text-neutral-400 transition-transform group-hover/card:translate-x-1 group-hover/card:text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className={`mt-4 font-semibold ${
            isPassed
              ? "text-neutral-500 dark:text-neutral-400"
              : "text-neutral-900 dark:text-white"
          }`}>
            {course.title}
          </h3>

          {/* Description */}
          {course.description && (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {course.description}
            </p>
          )}

          {/* Exam date info */}
          {exam && (
            <div className={`mt-4 flex items-center gap-2 text-xs ${
              isPassed
                ? "text-neutral-400 dark:text-neutral-500"
                : "text-neutral-500 dark:text-neutral-400"
            }`}>
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{exam.date}</span>
              <Clock className="h-3 w-3 shrink-0 ml-1" />
              <span className="truncate">{exam.time}</span>
            </div>
          )}
        </div>
      </SmartLink>
    </div>
  );
}
