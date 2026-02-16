import Link from "next/link";

interface LockedResourcePreviewProps {
  resourceType: "audio" | "video" | "pdf" | "image";
  title: string;
  description?: string | null;
  courseCode: string;
}

export function LockedResourcePreview({
  resourceType,
  title,
  description,
  courseCode,
}: LockedResourcePreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
      {/* Blurred Background Preview Mimicry */}
      <div className="absolute inset-0 z-0 opacity-50 dark:opacity-30">
        {resourceType === "video" && (
          <div className="flex h-full flex-col">
            {/* Header mimicry */}
            <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex flex-1 items-center justify-center bg-neutral-900">
              <div className="h-20 w-20 rounded-full border-4 border-white/20 flex items-center justify-center">
                <div className="ml-2 h-0 w-0 border-y-[15px] border-y-transparent border-l-[25px] border-l-white/40" />
              </div>
            </div>
            {/* Controls mimicry */}
            <div className="h-10 w-full bg-neutral-800 px-4 flex items-center gap-4">
               <div className="h-2 w-full rounded-full bg-neutral-700" />
               <div className="h-4 w-12 rounded bg-neutral-700" />
            </div>
          </div>
        )}
        {resourceType === "audio" && (
          <div className="flex h-full flex-col items-center justify-center bg-purple-50 dark:bg-purple-950/20 px-8">
            <div className="flex w-full items-end justify-center gap-1.5 h-32">
              {[...Array(32)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full bg-purple-400/30 dark:bg-purple-600/30 rounded-t-sm"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-8 flex items-center gap-6">
              <div className="h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-800" />
              <div className="h-4 w-48 rounded-full bg-purple-200 dark:bg-purple-800" />
            </div>
          </div>
        )}
        {resourceType === "pdf" && (
          <div className="flex h-full gap-8 p-12 bg-neutral-50 dark:bg-neutral-950">
            <div className="flex-1 rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="space-y-4">
                <div className="h-8 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-4 w-full rounded bg-neutral-50 dark:bg-neutral-800/50" />
                <div className="h-4 w-full rounded bg-neutral-50 dark:bg-neutral-800/50" />
                <div className="h-4 w-5/6 rounded bg-neutral-50 dark:bg-neutral-800/50" />
                <div className="mt-8 h-40 w-full rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
            <div className="flex-1 hidden md:block rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900 opacity-50 translate-y-8">
               <div className="space-y-4">
                <div className="h-4 w-full rounded bg-neutral-50 dark:bg-neutral-800/50" />
                <div className="h-4 w-full rounded bg-neutral-50 dark:bg-neutral-800/50" />
              </div>
            </div>
          </div>
        )}
        {resourceType === "image" && (
          <div className="flex h-full flex-wrap gap-4 p-8 bg-neutral-100 dark:bg-neutral-900">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-32 flex-1 min-w-[30%] rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center"
              >
                <div className="h-10 w-10 rounded border-2 border-dashed border-neutral-200 dark:border-neutral-700" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blurred Overlay */}
      <div className="absolute inset-0 z-10 backdrop-blur-[12px] bg-white/40 dark:bg-neutral-950/40" />

      {/* Content Card */}
      <div className="relative z-20 flex min-h-[450px] flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        {/* Lock Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl dark:bg-neutral-800 ring-1 ring-black/5 dark:ring-white/10">
          <svg
            className="h-8 w-8 text-primary-600 dark:text-primary-400"
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

        {/* Title & Description */}
        <div className="space-y-3 mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            {title}
          </h2>
          {description && (
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {description}
            </p>
          )}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider">
            Premium {resourceType === "pdf" ? "Document" : resourceType === "image" ? "Visual" : resourceType}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 w-full sm:flex-row sm:justify-center">
          <Link
            href={`/login?redirect=/course/${courseCode}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            Login to Access
          </Link>
          <Link
            href="/signup"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-8 py-4 font-bold text-neutral-900 transition-all hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            Sign up to Unlock
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-medium text-neutral-500 dark:text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-800/50 pt-8">
          <div className="flex items-center gap-2 justify-center">
            <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified Content
          </div>
          <div className="flex items-center gap-2 justify-center">
             <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Full Access
          </div>
          <div className="flex items-center gap-2 justify-center col-span-2 sm:col-span-1">
             <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            All Courses
          </div>
        </div>
      </div>
    </div>
  );
}
