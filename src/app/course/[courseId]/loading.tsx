export default function CourseLoading() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-4 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Course header skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
        <div className="h-6 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-3 h-8 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-2 h-4 w-96 rounded bg-neutral-200 dark:bg-neutral-800" />
        
        <div className="mt-6 flex gap-4">
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-8 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Resources section skeleton */}
      <div className="mt-8">
        <div className="h-6 w-36 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-1 h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="h-12 w-12 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex-1">
                <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="mt-2 h-5 w-48 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="mt-1 h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
