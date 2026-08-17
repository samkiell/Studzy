import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

interface ForgotPasswordPageProps {
  searchParams: Promise<{ token?: string; email?: string; error?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { token, email, error } = await searchParams;

  // If a reset token is present in the URL, forward immediately to the recovery authentication handler
  if (token) {
    redirect(`/api/auth/recover?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ""}`);
  }

  const errorMessage = 
    error === "expired_token" ? "Your password reset link has expired. Please request a new one below." :
    error === "invalid_token" ? "This reset link is invalid or has already been used. Please request a new link." :
    error === "user_not_found" ? "Account not found. Please verify your email and try again." :
    error ? "Unable to verify reset link. Please try requesting a new one." : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/favicon.png" alt="Studzy" width={40} height={40} />
            <span className="text-2xl font-bold text-primary-600">Studzy</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-400 text-center font-medium">
            {errorMessage}
          </div>
        )}

        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
