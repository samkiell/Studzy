import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses as coursesTable, resources, bookmarks } from "@/lib/db/schema/courses";
import { users } from "@/lib/db/schema/auth";
import { userActivity } from "@/lib/db/schema/activity";
import { eq, and, asc, count, ne, gt, sql } from "drizzle-orm";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { ContinueStudying } from "@/components/dashboard/ContinueStudying";
import { ExamCountdown } from "@/components/dashboard/ExamCountdown";

import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";
import { BookmarksWidget } from "@/components/dashboard/BookmarksWidget";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import Link from "next/link";
import { BookOpen, FileText, Eye, Zap, ShieldAlert, MessageCircle, Brain, ArrowRight, Flame } from "lucide-react";
import type { Course } from "@/types/database";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all courses
  const courses = await db
    .select()
    .from(coursesTable)
    .orderBy(asc(coursesTable.code));

  // Fetch total resources count (published & not question bank)
  const [{ total: totalResourcesCount }] = await db
    .select({ total: count() })
    .from(resources)
    .where(
      and(
        eq(resources.status, "published"),
        ne(resources.type, "question_bank")
      )
    );

  // Fetch user bookmarks count
  const [{ total: bookmarksCount }] = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(eq(bookmarks.user_id, user.id));

  // Fetch all user activity to calculate unique views
  const activityLogs = await db
    .select({
      resource_id: userActivity.resource_id,
      action_type: userActivity.action_type,
    })
    .from(userActivity)
    .where(eq(userActivity.user_id, user.id));

  const uniqueViews = new Set(
    activityLogs
      .filter((a) => a.action_type === "view_resource" && a.resource_id)
      .map((a) => a.resource_id)
  ).size;

  const totalSeconds = user.total_study_seconds || 0;

  // Fetch rank based on study time among non-admins
  const [{ total: higherRankCount }] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        gt(users.total_study_seconds, totalSeconds),
        ne(users.role, "admin")
      )
    );

  const userRank = totalSeconds > 0 ? (higherRankCount || 0) + 1 : 0;
  const username = user.username || user.name?.split(" ")[0] || user.email?.split("@")[0] || "student";
  const displayName = user.full_name || user.name || username;
  const avatarUrl = user.avatar_url || user.image;

  // Format time
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

      <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Current Streak" 
          value={`${user.current_streak || 0} days`}
          icon={<Flame className="h-5 w-5 text-orange-500" />}
        />
        <StatCard 
          title="Total Courses" 
          value={String(courses?.length || 0)} 
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard 
          title="Total Resources" 
          value={String(totalResourcesCount || 0)}
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

      <div className="mt-6 flex items-center justify-start">
        <Link
          href="/cbt"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-indigo-500 hover:to-purple-500 active:scale-95 shrink-0"
        >
          <Brain className="h-4 w-4" />
          <span>Launch CBT Practice</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
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
              <CourseGrid courses={(courses as unknown as Course[]) || []} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {user.is_verified ? (
            <StudentIDCard 
              displayName={displayName}
              username={username}
              role={user.role === "admin" ? "Admin" : "Student"}
              avatarUrl={avatarUrl}
              initialStack="Software Engineering"
              stats={{
                resourcesViewed: uniqueViews,
                hours: Math.floor(totalSeconds / 3600),
                rank: userRank, 
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

          <LeaderboardWidget 
            currentUserId={user.id}
            currentUserRank={userRank}
            currentUserTotalSeconds={totalSeconds}
            currentUserAvatar={avatarUrl || undefined}
            currentUsername={username}
          />
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
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900 flex flex-col justify-between gap-3 min-h-[110px]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 w-fit shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 truncate">{title}</p>
        <p className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}
