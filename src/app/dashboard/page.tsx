import { createClient } from "@/lib/supabase/server";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { ContinueStudying } from "@/components/dashboard/ContinueStudying";
import { BookOpen, FileText, Eye, Zap } from "lucide-react";
import type { Course } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/auth/login");
  }

  // Fetch all courses
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  // Fetch total resources count (only published)
  const [
    { count: totalResources },
    { count: viewedResourcesCount }
  ] = await Promise.all([
    supabase.from("resources").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("user_activity").select("resource_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action_type", "view_resource")
  ]);

  if (error) {
    console.error("Error fetching dashboard data:", error);
  }

  // Get display name: prefer first name from metadata, fall back to email prefix
  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.user_metadata?.name?.split(" ")[0] ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "";

  // Fetch all activity to calculate stats
  const { data: activityLogs } = await supabase
    .from("user_activity")
    .select("resource_id, action_type")
    .eq("user_id", user.id);

  const uniqueViews = new Set(
    activityLogs
      ?.filter(a => a.action_type === "view_resource" && a.resource_id)
      .map(a => a.resource_id)
  ).size;

  // Estimate hours: 30 minutes per unique resource viewed/studied
  const estimatedHours = (uniqueViews * 0.5).toFixed(1);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Select a course to access study materials.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Courses" 
          value={String(courses?.length || 0)} 
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard 
          title="Total Resources" 
          value={String(totalResources || 0)}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard 
          title="Resources Viewed" 
          value={String(uniqueViews)}
          icon={<Eye className="h-5 w-5" />}
        />
        <StatCard 
          title="Hours Studied" 
          value={estimatedHours}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      <div className="mt-10">
        <ContinueStudying />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Your Courses
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Click on a course to view resources and materials.
        </p>
        <div className="mt-4">
          <CourseGrid courses={(courses as Course[]) || []} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
