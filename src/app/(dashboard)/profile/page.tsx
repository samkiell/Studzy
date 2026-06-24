import { createClient } from "@/lib/supabase/server";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, ShieldCheck, GraduationCap, Clock, Award, Bookmark, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch stats for ID card
  const { count: bookmarksCount } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const totalSeconds = profile?.total_study_seconds || 0;

  // Fetch rank based on study time among non-admins
  const { count: higherRankCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("total_study_seconds", totalSeconds)
    .neq("role", "admin");

  const userRank = totalSeconds > 0 ? (higherRankCount || 0) + 1 : 0;

  // Fetch all activity to calculate views
  const { data: activityLogs } = await supabase
    .from("user_activity")
    .select("resource_id, action_type")
    .eq("user_id", user.id);

  const uniqueViews = new Set(
    activityLogs
      ?.filter(a => a.action_type === "view_resource" && a.resource_id)
      .map(a => a.resource_id)
  ).size;

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
  const username = profile?.username || user.email?.split("@")[0] || "student";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
            Academic Identity
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            View your Student Digital ID card and verified performance stats.
          </p>
        </div>
        <Link href="/settings" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full justify-center gap-2">
            <Settings className="h-4 w-4" />
            Edit Settings
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: ID Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400 text-center lg:text-left">
              Digital Student ID
            </h3>
            {profile?.is_verified ? (
              <StudentIDCard 
                displayName={displayName}
                username={username}
                role={profile?.role === "admin" ? "Admin" : "Student"}
                avatarUrl={profile?.avatar_url}
                initialStack={user?.user_metadata?.stack || "Frontend Dev"}
                stats={{
                  resourcesViewed: uniqueViews,
                  hours: Math.floor(totalSeconds / 3600),
                  rank: userRank,
                  bookmarks: bookmarksCount || 0
                }}
              />
            ) : (
              <div className="mx-auto max-w-[320px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900 dark:text-white">ID Card Generation Locked</h3>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  You need to be verified as a Software Engineering student to generate your student ID card.
                </p>
                <a 
                  href={`https://wa.link/5i91sx?text=${encodeURIComponent(`Hello, please verify me. My username is ${username}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-green-600 active:scale-95 shadow-sm shadow-green-500/20"
                >
                  Request Verification
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Performance Stats and Info */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-400">
              Verified Statistics
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-850 dark:bg-neutral-900/30 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2.5 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Resource Views</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">{uniqueViews}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-850 dark:bg-neutral-900/30 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2.5 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Study Duration</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">{Math.floor(totalSeconds / 3600)} hrs</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-850 dark:bg-neutral-900/30 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-100 p-2.5 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Platform Rank</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">{userRank > 0 ? `#${userRank}` : "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-850 dark:bg-neutral-900/30 backdrop-blur-xs">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Saved Items</p>
                    <p className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">{bookmarksCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Info Card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/30 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2.5 text-neutral-950 dark:text-white font-bold">
              <ShieldCheck className="h-5 w-5 text-primary-500" />
              <span>Identity Verification Status</span>
            </div>
            
            <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2 leading-relaxed">
              <p>
                Studzy enforces verification checks for generating academic ID cards. This guarantees the authenticity of student rankings and badges.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-850 dark:text-neutral-400">
                  Role: {profile?.role === "admin" ? "Administrator" : "Student"}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  profile?.is_verified 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-amber-500/10 text-amber-500"
                }`}>
                  Status: {profile?.is_verified ? "Verified ✓" : "Verification Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
