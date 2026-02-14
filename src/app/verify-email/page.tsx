import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function VerifyEmailPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email_confirmed_at) {
    redirect("/dashboard");
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
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          We&apos;ve sent a verification link to <strong>{user.email}</strong>. Please check your inbox and click the link to continue.
        </p>
        
        <div className="mt-8 space-y-4">
          <p className="text-xs text-neutral-500">
            Can&apos;t find the email? Check your spam folder or click below to resend.
          </p>
          {/* In a real app, you'd add a Client Component button here to trigger resendConfirmation */}
          <Link href="/login" className="block text-sm font-medium text-primary-600 hover:text-primary-500">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
