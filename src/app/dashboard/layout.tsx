import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

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
    .select("role, status")
    .eq("id", user.id)
    .single();

  // Handle suspended users
  if (profile?.status === 'suspended') {
    // Optionally sign out or just redirect to a suspended page
    // For now, redirect to a simple page or show message
    // Actually, I'll just redirect to login with a message
    redirect("/login?error=account_suspended");
  }

  // Update last login (non-blocking)
  supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id).then();

  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <DashboardNav user={user} isAdmin={isAdmin} />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
