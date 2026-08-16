import { db } from "@/lib/db";
import { resources, courses } from "@/lib/db/schema/courses";
import { desc, eq } from "drizzle-orm";
import { AdminResourceTable } from "@/components/admin/AdminResourceTable";
import { Star } from "lucide-react";

export default async function AdminResourcesPage() {
  const allResources = await db
    .select({
      id: resources.id,
      title: resources.title,
      type: resources.type,
      status: resources.status,
      featured: resources.featured,
      file_url: resources.file_url,
      view_count: resources.view_count,
      created_at: resources.created_at,
      course_code: courses.code,
    })
    .from(resources)
    .leftJoin(courses, eq(resources.course_id, courses.id))
    .orderBy(desc(resources.created_at));

  const formattedResources = (allResources || []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    status: (r.status as "draft" | "published") || "draft",
    featured: !!r.featured,
    view_count: r.view_count || 0,
    course_code: r.course_code || "N/A",
    created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    file_url: r.file_url,
  }));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
            Manage Resources
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Toggle featured and draft/published status
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
            Published
          </span>
          <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <span className="inline-block h-3 w-3 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            Draft
          </span>
          <span className="flex items-center gap-1.5 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            Featured
          </span>
        </div>
      </div>

      <AdminResourceTable resources={formattedResources} />
    </div>
  );
}
