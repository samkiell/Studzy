import Link from "next/link";
import type { Course } from "@/types/database";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/course/${course.code}`}>
      <div className="group h-full rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center rounded-lg bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            {course.code}
          </span>
          <svg
            className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-500"
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
        <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">
          {course.title}
        </h3>
        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {course.description}
          </p>
        )}
      </div>
    </Link>
  );
}
