import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { logActivity } from "@/lib/activity";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check profile and update last login
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, last_login")
    .eq("id", user.id)
    .single();

  // Handle suspended users
  if (profile?.status === 'suspended') {
    redirect("/login?error=account_suspended");
  }

  // Activity Logging & Last Login Update
  const lastLogin = profile?.last_login ? new Date(profile.last_login) : new Date(0);
  const now = new Date();
  const timeSinceLogin = now.getTime() - lastLogin.getTime();
  
  // Update last_login and log access if > 30 mins since last recorded activity
  if (timeSinceLogin > 30 * 60 * 1000) {
    await supabase.from("profiles").update({ last_login: now.toISOString() }).eq("id", user.id);
    await logActivity("login");
  } else {
    // Just update timestamp for accuracy without clogging logs
    supabase.from("profiles").update({ last_login: now.toISOString() }).eq("id", user.id).then();
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <DashboardNav user={user} isAdmin={isAdmin} />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
