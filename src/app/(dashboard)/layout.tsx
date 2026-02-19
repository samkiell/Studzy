import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { logActivity } from "@/lib/activity";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for global tracking and role-based logic
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, last_login, username, full_name, avatar_url, email, email_confirmed_at")
    .eq("id", user.id)
    .single();

  // Handle suspended users
  if (profile?.status === 'suspended') {
    redirect("/login?error=account_suspended");
  }

  // Activity Tracking & Data Sync
  const lastLogin = profile?.last_login ? new Date(profile.last_login) : new Date(0);
  const now = new Date();
  const timeSinceSync = now.getTime() - lastLogin.getTime();
  
  // Sync core user data from Auth to Profile
  // Always update if email_confirmed_at is missing in profile but present in auth
  const needsVerificationSync = !profile?.email_confirmed_at && user.email_confirmed_at;
  const needsEmailSync = !profile?.email && user.email;
  const needsUsernameSync = !profile?.username && user.user_metadata?.username;

  if (timeSinceSync > 15 * 60 * 1000 || needsVerificationSync || needsEmailSync || needsUsernameSync) {
    const adminClient = createAdminClient();
    await adminClient.from("profiles").update({ 
      last_login: now.toISOString(),
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      username: profile?.username || user.user_metadata?.username,
      full_name: profile?.full_name || user.user_metadata?.full_name,
    }).eq("id", user.id);
    
    // Only log "login" activity if it's been more than 30 mins
    if (timeSinceSync > 30 * 60 * 1000) {
      await logActivity("login");
    }
  } else {
    // Just keep the timestamp fresh for presence
    const adminClient = createAdminClient();
    await adminClient.from("profiles").update({ last_login: now.toISOString() }).eq("id", user.id);
  }

  return (
    <DashboardLayout 
      role={profile?.role || 'student'}
      user={{
        username: profile?.username || user.user_metadata?.username,
        full_name: profile?.full_name || user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        email: user.email
      }}
    >
      {children}
    </DashboardLayout>
  );
}
