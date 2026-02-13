import Link from "next/link";

interface LockedResourcePreviewProps {
  resourceType: "audio" | "video" | "pdf";
  title: string;
  courseId: string;
}

export function LockedResourcePreview({
  resourceType,
  title,
  courseId,
}: LockedResourcePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred Background Preview */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
        {resourceType === "video" && (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-32 w-32 text-primary-300 blur-sm dark:text-primary-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
        {resourceType === "audio" && (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-32 w-32 text-purple-300 blur-sm dark:text-purple-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        )}
        {resourceType === "pdf" && (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-32 w-32 text-blue-300 blur-sm dark:text-blue-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={0.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Blurred Overlay */}
      <div className="absolute inset-0 backdrop-blur-lg" />

      {/* Content Card */}
      <div className="relative flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        {/* Lock Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/80 shadow-xl backdrop-blur-sm dark:bg-neutral-800/80">
          <svg
            className="h-10 w-10 text-neutral-600 dark:text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          This {resourceType === "pdf" ? "document" : resourceType} is only available to registered students
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/login?redirect=/course/${courseId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            Login to Access
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 py-3 font-semibold text-neutral-700 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Create Account
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Free to use
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Unlimited access
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            All courses included
          </span>
        </div>
      </div>
    </div>
  );
}
