import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { ResendButton } from "@/components/auth/ResendButton";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const targetEmail = params?.email || user?.email || "";

  // If the user is logged in and already verified, show verified status
  if (user && (user.is_verified || user.emailVerified)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-white">
            Email Verified
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Your Studzy account is active and verified. You have full access to all resources and AI features.
          </p>
          <div className="mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="relative w-full max-w-md">
        {/* Background decorative gradient blurs */}
        <div className="absolute -top-20 -left-20 h-44 w-44 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-center">
            {/* Mail Icon badge */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
              <Mail className="h-8 w-8 animate-pulse" />
            </div>

            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Image src="/favicon.png" alt="Studzy" width={28} height={28} />
              <span className="text-xl font-bold text-primary-600">Studzy</span>
            </Link>

            <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
              Check your inbox
            </h1>

            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              We&apos;ve sent a verification link to
            </p>

            {targetEmail && (
              <p className="mt-1 font-mono text-sm font-semibold text-neutral-900 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg py-1 px-3 inline-block">
                {targetEmail}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50/60 p-4 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/30 dark:text-neutral-400 space-y-2">
              <p className="font-semibold text-neutral-700 dark:text-neutral-300">Next steps:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Open the email from <strong>Studzy</strong>.</li>
                <li>Click the <strong>Confirm Account</strong> button.</li>
                <li>If you don&apos;t see it within 1–2 minutes, check your <strong>Spam / Junk</strong> folder.</li>
              </ol>
            </div>

            {/* Resend Action */}
            {targetEmail && (
              <div className="mt-6">
                <ResendButton email={targetEmail} />
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
              <Link href="/signup" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Change email
              </Link>
              <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Back to Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
