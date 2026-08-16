import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
          <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Account Confirmed
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Your account is active. You can now access all Studzy resources.
        </p>
        
        <div className="mt-8 space-y-4">
          <Link href="/dashboard" className="block text-sm font-medium text-primary-600 hover:text-primary-500">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
