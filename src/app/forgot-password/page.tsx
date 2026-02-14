import Link from "next/link";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
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
