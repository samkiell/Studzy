import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
          <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Link Expired
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          This link may have expired or already been used. Please try signing in, or sign up again if needed.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login">
            <Button className="w-full">Go to Login</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="w-full">Create a new account</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
