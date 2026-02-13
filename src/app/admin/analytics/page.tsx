import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";

interface ResourceAnalytics {
  id: string;
  title: string;
  type: string;
  view_count: number;
  completion_count: number;
  status: string;
  featured: boolean;
  course_code: string;
  course_title: string;
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
      completion_count,
      status,
      featured,
      courses (
        code,
        title
      )
    `
    )
    .order("view_count", { ascending: false });

  // Combine data
  const analytics: ResourceAnalytics[] = (resources || []).map(
    (r: any) => {
      const course = r.courses;
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        view_count: r.view_count || 0,
        completion_count: r.completion_count || 0,
        status: r.status,
        featured: r.featured,
        course_code: course?.code || "N/A",
        course_title: course?.title || "Unknown",
      };
    }
  );

  // Summary stats
  const totalViews = analytics.reduce((sum, r) => sum + r.view_count, 0);
  const totalCompletions = analytics.reduce((sum, r) => sum + r.completion_count, 0);
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
                      {resource.completion_count.toLocaleString()}
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
                          <Star className="h-5 w-5 fill-current" />
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
