import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema/courses";
import { userActivity } from "@/lib/db/schema/activity";
import { users } from "@/lib/db/schema/auth";
import { eq, desc } from "drizzle-orm";
import { Star, Activity, Eye, ShieldCheck } from "lucide-react";

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
  const allResources = await db
    .select({
      id: resources.id,
      title: resources.title,
      type: resources.type,
      view_count: resources.view_count,
      completion_count: resources.completion_count,
      status: resources.status,
      featured: resources.featured,
      course_code: courses.code,
      course_title: courses.title,
    })
    .from(resources)
    .leftJoin(courses, eq(resources.course_id, courses.id))
    .orderBy(desc(resources.view_count));

  const recentActivities = await db
    .select({
      id: userActivity.id,
      action_type: userActivity.action_type,
      created_at: userActivity.created_at,
      metadata: userActivity.metadata,
      resource_title: resources.title,
      user_name: users.full_name,
      user_username: users.username,
    })
    .from(userActivity)
    .leftJoin(resources, eq(userActivity.resource_id, resources.id))
    .leftJoin(users, eq(userActivity.user_id, users.id))
    .orderBy(desc(userActivity.created_at))
    .limit(50);

  const analytics: ResourceAnalytics[] = (allResources || []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    view_count: r.view_count || 0,
    completion_count: r.completion_count || 0,
    status: r.status,
    featured: !!r.featured,
    course_code: r.course_code || "N/A",
    course_title: r.course_title || "Unknown",
  }));

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
          Track resource views and completions in real time
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

      {/* Activity Log */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-500" />
          Recent User Actions
        </h2>
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[600px] overflow-y-auto">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    act.action_type === "view_resource" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                    act.action_type === "complete_resource" ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                    act.action_type.startsWith("ai_") ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                    "bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}>
                    {act.action_type === "view_resource" ? <Eye className="h-4 w-4" /> :
                     act.action_type === "complete_resource" ? <ShieldCheck className="h-4 w-4" /> :
                     <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{act.user_username || act.user_name || "Unknown User"}</span>
                      {" • "}
                      {act.action_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {act.resource_title || "System Activity"}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">
                      {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {act.created_at ? new Date(act.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-neutral-500">No recent activity recorded</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
