import { createClient } from "@/lib/supabase/server";
import { AdminResourceTable } from "@/components/admin/AdminResourceTable";

export default async function AdminResourcesPage() {
  const supabase = await createClient();

  // Fetch all resources with course info (admin sees everything including drafts)
  const { data: resources } = await supabase
    .from("resources")
    .select(
      `
      id,
      title,
      type,
      status,
      featured,
      view_count,
      created_at,
      courses (
        code
      )
    `
    )
    .order("created_at", { ascending: false });

  const formattedResources = (resources || []).map(
    (r: Record<string, unknown>) => {
      const course = r.courses as { code: string } | null;
      return {
        id: r.id as string,
        title: r.title as string,
        type: r.type as string,
        status: r.status as "draft" | "published",
        featured: r.featured as boolean,
        view_count: (r.view_count as number) || 0,
        course_code: course?.code || "N/A",
        created_at: r.created_at as string,
      };
    }
  );

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
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        </div>
      </div>

      <AdminResourceTable resources={formattedResources} />
    </div>
  );
}
