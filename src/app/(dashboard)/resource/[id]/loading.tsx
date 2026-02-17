export default function ResourceLoading() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Resource card skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="h-20 w-20 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex-1">
            <div className="h-5 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-8 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-3 h-4 w-96 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-4 h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
        <div className="mt-8 flex gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <div className="h-12 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-12 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Preview skeleton */}
      <div className="mt-8">
        <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 aspect-video w-full rounded-xl bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
