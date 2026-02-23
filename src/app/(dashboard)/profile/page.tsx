import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import { redirect } from "next/navigation";

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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white sm:text-3xl">
          Your Profile
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Manage your account settings and academic identity.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProfileEditor 
            initialBio={profile?.bio} 
            initialGoal={profile?.learning_goal} 
          />
        </div>
        
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-neutral-400">
              Your Digital ID
            </h3>
            {profile?.is_verified ? (
              <StudentIDCard 
                displayName={displayName}
                username={username}
                role={profile?.role === "admin" ? "Admin" : "Student"}
                avatarUrl={profile?.avatar_url}
                stats={{
                  resourcesViewed: uniqueViews,
                  hours: Math.floor(totalSeconds / 3600), // Math fixed back to hours
                  rank: userRank,
                  bookmarks: bookmarksCount || 0
                }}
              />
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Abeg Verify me
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
