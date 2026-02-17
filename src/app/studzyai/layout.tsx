import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export default async function StudzyAILayout({
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
    .select("role, status, last_login")
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
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {children}
    </div>
  );
}
