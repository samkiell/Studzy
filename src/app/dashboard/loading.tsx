export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-5 w-96 rounded bg-neutral-200 dark:bg-neutral-800" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mt-2 h-8 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mx-auto h-4 w-64 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
