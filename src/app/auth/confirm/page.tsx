import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ConfirmPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Email Confirmed!
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Your email has been verified successfully. You can now sign in to your account.
        </p>
        <div className="mt-8">
          <Link href="/login">
            <Button className="w-full">Sign in to your account</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
