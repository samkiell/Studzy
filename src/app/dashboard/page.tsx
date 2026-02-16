import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { ContinueStudying } from "@/components/dashboard/ContinueStudying";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";
import { BookmarksWidget } from "@/components/dashboard/BookmarksWidget";
import { BookOpen, FileText, Eye, Zap, CreditCard } from "lucide-react";
import type { Course } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

  // Get display name: prefer username from metadata, then first name, fall back to email prefix
  const displayName =
    user?.user_metadata?.username ||
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

  // Fetch profile for study time and streak
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_study_seconds, current_streak")
    .eq("id", user.id)
    .single();

  const totalSeconds = profile?.total_study_seconds || 0;
  const currentStreak = profile?.current_streak || 0;

  // Format time: only show non-zero units
  const formatStudyTime = (totalSecs: number) => {
    if (totalSecs <= 0) return "0s";
    
    const d = Math.floor(totalSecs / (3600 * 24));
    const h = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(" ");
  };

  const formattedTime = formatStudyTime(totalSeconds);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
              Welcome back{displayName ? `, ${displayName}` : ""}
            </h1>
            <span className="hidden rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 md:block">
              DevCore&apos;23
            </span>
          </div>
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
          title="Time Studied" 
          value={formattedTime}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-10">
          <ContinueStudying />
          
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Your Courses
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Omo, Exam don near oo. Select the course wey you wan brainstorm and get access to the full resources.
            </p>
            <div className="mt-4">
              <CourseGrid courses={(courses as Course[]) || []} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <StreakCounter streak={currentStreak} />
          
          {/* Digital ID Card Preview */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-neutral-900 dark:text-white">Student ID</h3>
              </div>
              <Link href="/profile" className="text-xs font-medium text-primary-600 hover:underline">
                View Card
              </Link>
            </div>
            <div className="aspect-[1.58/1] w-full rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 p-4 text-white">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold tracking-widest uppercase">DevCore&apos;23 Student</p>
                <div className="h-6 w-6 rounded bg-white/20" />
              </div>
              <div className="mt-8">
                <p className="text-lg font-bold truncate">{displayName}</p>
                <p className="text-[10px] opacity-80 uppercase">Software Engineering</p>
              </div>
            </div>
          </div>

          <LeaderboardWidget />
          <BookmarksWidget />
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
