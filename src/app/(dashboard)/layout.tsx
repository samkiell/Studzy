import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("role, status, last_login, username, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Handle suspended users
  if (profile?.status === 'suspended') {
    redirect("/login?error=account_suspended");
  }

  // Activity Tracking: Update last_login if needed
  const lastLogin = profile?.last_login ? new Date(profile.last_login) : new Date(0);
  const now = new Date();
  const timeSinceLogin = now.getTime() - lastLogin.getTime();
  
  // Throttle updates: every 30 minutes for activity logs, but always update profile timestamp
  if (timeSinceLogin > 30 * 60 * 1000) {
    await supabase.from("profiles").update({ last_login: now.toISOString() }).eq("id", user.id);
    await logActivity("login");
  } else {
    // Keep timestamp fresh for presence
    supabase.from("profiles").update({ last_login: now.toISOString() }).eq("id", user.id).then();
  }

  return (
    <DashboardLayout user={{
      username: profile?.username || user.user_metadata?.username,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
      email: user.email
    }}>
      {children}
    </DashboardLayout>
  );
}
