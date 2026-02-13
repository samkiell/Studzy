export default function AdminUploadLoading() {
  return (
    <div>
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="mt-2 h-5 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      {/* Upload Card Skeleton */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 md:p-8">
          {/* Info Banner Skeleton */}
          <div className="mb-6 h-24 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />

          {/* Form Fields Skeleton */}
          <div className="space-y-6">
            <div>
              <div className="mb-2 h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-12 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div>
              <div className="mb-2 h-4 w-28 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-12 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div>
              <div className="mb-2 h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                <div className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </div>
            <div>
              <div className="mb-2 h-4 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="h-12 animate-pulse rounded-lg bg-primary-200 dark:bg-primary-900" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
