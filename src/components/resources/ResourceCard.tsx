import Link from "next/link";
import type { Resource } from "@/types/database";

interface ResourceCardProps {
  resource: Resource;
  courseCode: string;
  isCompleted?: boolean;
}

const typeIcons = {
  video: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  audio: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
      />
    </svg>
  ),
  pdf: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  image: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  document: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

const typeColors = {
  video: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  audio: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  pdf: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  image: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  document: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

const typeLabels = {
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  image: "Image",
  document: "Document",
};

export function ResourceCard({ resource, courseCode, isCompleted = false }: ResourceCardProps) {
  return (
    <Link href={`/course/${courseCode}/resource/${resource.slug}`}>
      <div className="group flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700">
        <div className="relative">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${typeColors[resource.type]}`}
          >
            {typeIcons[resource.type]}
          </div>
          {isCompleted && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${typeColors[resource.type]}`}
            >
              {typeLabels[resource.type]}
            </span>
            {resource.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Exam Focused
              </span>
            )}
          </div>
          <h4 className="mt-1 font-medium text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {resource.title}
          </h4>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
              {resource.description}
            </p>
          )}
        </div>
        <svg
          className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-primary-500"
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
    </Link>
  );
}
