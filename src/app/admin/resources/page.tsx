import { createClient } from "@/lib/supabase/server";
import { AdminResourceTable } from "@/components/admin/AdminResourceTable";
import { Star } from "lucide-react";

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
      file_url,
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
        file_url: r.file_url as string,
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
            <Star className="h-4 w-4 fill-current" />
            Featured
          </span>
        </div>
      </div>

      <AdminResourceTable resources={formattedResources} />
    </div>
  );
}
