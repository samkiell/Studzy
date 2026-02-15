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
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {children}
        
        {/* Bottom AI Access */}
        <div className="mt-20 pb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-8 shadow-2xl dark:from-primary-900 dark:to-neutral-900">
            {/* Background Decorations */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary-400/20 blur-3xl" />
            
            <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white md:text-3xl">
                  Ready to study smarter? 🚀
                </h2>
                <p className="mt-2 text-primary-100 dark:text-neutral-300">
                  Ask STUDZY AI to explain concepts, generate quizzes, or summarize your notes.
                </p>
              </div>
              <Link 
                href="/studzyai"
                className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-lg font-bold text-primary-600 shadow-lg transition-all hover:scale-105 hover:bg-neutral-50 active:scale-95 dark:bg-neutral-800 dark:text-primary-400 dark:hover:bg-neutral-700"
              >
                <span>Chat with STUDZY AI</span>
                <svg 
                  className="h-5 w-5 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-500">
            <p>© {new Date().getFullYear()} Studzy • Created with ⚡ by Samkiel</p>
          </div>
        </div>
      </main>
    </div>
  );
}
