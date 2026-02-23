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
            <StudentIDCard 
              displayName={displayName}
              username={username}
              role={profile?.role === "admin" ? "Admin" : "Student"}
              avatarUrl={profile?.avatar_url}
              stats={{
                resourcesViewed: uniqueViews,
                hours: Math.floor((profile?.total_study_seconds || 0) / 3600),
                rank: profile?.rank || 0,
                bookmarks: bookmarksCount || 0
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
