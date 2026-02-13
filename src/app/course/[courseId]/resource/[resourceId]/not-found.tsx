import Link from "next/link";

export default function ResourceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <svg
              className="h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-neutral-900 dark:text-white">
          Resource Not Found
        </h1>
        <p className="mb-8 text-neutral-600 dark:text-neutral-400">
          This resource doesn't exist or may have been removed.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Courses
        </Link>
      </div>
    </div>
  );
}
