import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { ContinueStudying } from "@/components/dashboard/ContinueStudying";
import { ExamCountdown } from "@/components/dashboard/ExamCountdown";

import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";
import { BookmarksWidget } from "@/components/dashboard/BookmarksWidget";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { BookOpen, FileText, Eye, Zap, CreditCard, ShieldAlert, MessageCircle } from "lucide-react";
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
    { count: viewedResourcesCount },
    { count: bookmarksCount }
  ] = await Promise.all([
    supabase.from("resources").select("*", { count: "exact", head: true }).eq("status", "published").neq("type", "question_bank"),
    supabase.from("user_activity").select("resource_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("action_type", "view_resource"),
    supabase.from("bookmarks").select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
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

  // Fetch profile for study time, streak, and personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_study_seconds, current_streak, bio, learning_goal, avatar_url, username, role, is_verified, rank")
    .eq("id", user.id)
    .single();

  const totalSeconds = profile?.total_study_seconds || 0;
  const currentStreak = profile?.current_streak || 0;
  const bio = profile?.bio || null;
  const learningGoal = profile?.learning_goal || null;
  const avatarUrl = profile?.avatar_url || null;
  const username = profile?.username || user?.email?.split("@")[0] || "student";

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
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl md:text-3xl">
              Welcome back, {username}
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

      <div className="mt-8 grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
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
        <div className="lg:col-span-8 space-y-10 min-w-0 overflow-hidden">
          <ExamCountdown />
          <ContinueStudying />
          
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white sm:text-lg">
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

          
          {profile?.is_verified ? (
            <StudentIDCard 
              displayName={displayName}
              username={username}
              role={profile?.role === "admin" ? "Admin" : "Student"}
              avatarUrl={avatarUrl}
              stats={{
                resourcesViewed: uniqueViews,
                hours: Math.floor(totalSeconds / 3600),
                rank: profile?.rank || 0, 
                bookmarks: bookmarksCount || 0
              }}
            />
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">ID Card Generation Locked</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  You need to be verified as a Software Engineering student to generate an ID card.
                </p>
                <a 
                  href={`https://wa.link/5i91sx?text=${encodeURIComponent(`Hello, please verify me. My username is ${username}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 font-semibold text-white transition-all hover:bg-green-600 active:scale-95"
                >
                  <MessageCircle className="h-5 w-5" />
                  Abeg Verify me
                </a>
              </div>
            </div>
          )}

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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="truncate text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
