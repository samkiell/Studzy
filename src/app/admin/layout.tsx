import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Footer } from "@/components/ui/Footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login?redirect=/admin/upload");
  }

  // Check admin status
  const adminStatus = await isAdmin();
  
  if (!adminStatus) {
    // Not an admin - show access denied
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-10 w-10 sm:h-12 sm:w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
            Access Denied
          </h1>
          <p className="mb-8 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            You don&apos;t have permission to access the admin area.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <AdminHeader />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
