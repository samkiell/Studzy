export default function ResourceLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header Skeleton */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Skeleton */}
          <div className="mb-4 flex items-center gap-2">
            <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            <span className="text-neutral-300 dark:text-neutral-700">/</span>
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>

          {/* Title Skeleton */}
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
            <div className="flex-1">
              <div className="h-8 w-64 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-4 w-96 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="aspect-video w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-700" />
      </main>
    </div>
  );
}
