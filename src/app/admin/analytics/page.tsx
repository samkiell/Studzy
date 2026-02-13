import { createClient } from "@/lib/supabase/server";

interface ResourceAnalytics {
  id: string;
  title: string;
  type: string;
  view_count: number;
  status: string;
  featured: boolean;
  course_code: string;
  course_title: string;
  completions: number;
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Fetch all resources with course info
  const { data: resources } = await supabase
    .from("resources")
    .select(
      `
      id,
      title,
      type,
      view_count,
      status,
      featured,
      courses (
        code,
        title
      )
    `
    )
    .order("view_count", { ascending: false });

  // Fetch completion counts from user_progress
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("resource_id, completed")
    .eq("completed", true);

  // Build completion count map
  const completionMap: Record<string, number> = {};
  (progressData || []).forEach((p: { resource_id: string }) => {
    completionMap[p.resource_id] = (completionMap[p.resource_id] || 0) + 1;
  });

  // Combine data
  const analytics: ResourceAnalytics[] = (resources || []).map(
    (r: Record<string, unknown>) => {
      const course = r.courses as {
        code: string;
        title: string;
      } | null;
      return {
        id: r.id as string,
        title: r.title as string,
        type: r.type as string,
        view_count: (r.view_count as number) || 0,
        status: r.status as string,
        featured: r.featured as boolean,
        course_code: course?.code || "N/A",
        course_title: course?.title || "Unknown",
        completions: completionMap[r.id as string] || 0,
      };
    }
  );

  // Summary stats
  const totalViews = analytics.reduce((sum, r) => sum + r.view_count, 0);
  const totalCompletions = analytics.reduce((sum, r) => sum + r.completions, 0);
  const totalResources = analytics.length;
  const draftCount = analytics.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
          Resource Analytics
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Track resource views and completions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Total Resources
          </p>
          <p className="mt-1 text-3xl font-bold text-neutral-900 dark:text-white">
            {totalResources}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Total Views
          </p>
          <p className="mt-1 text-3xl font-bold text-primary-600 dark:text-primary-400">
            {totalViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Total Completions
          </p>
          <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">
            {totalCompletions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Drafts
          </p>
          <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {draftCount}
          </p>
        </div>
      </div>

      {/* Analytics Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                  Resource
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                  Course
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-700 dark:text-neutral-300">
                  Type
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                  Views
                </th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300">
                  Completions
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-neutral-700 dark:text-neutral-300">
                  Featured
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {analytics.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400"
                  >
                    No resources found
                  </td>
                </tr>
              ) : (
                analytics.map((resource) => (
                  <tr
                    key={resource.id}
                    className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-900 dark:text-white">
                      {resource.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {resource.course_code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          resource.type === "video"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : resource.type === "audio"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {resource.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-white">
                      {resource.view_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-green-600 dark:text-green-400">
                      {resource.completions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          resource.status === "published"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {resource.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {resource.featured ? (
                        <span className="inline-flex items-center text-amber-500">
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-neutral-300 dark:text-neutral-600">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
