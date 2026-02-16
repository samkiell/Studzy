"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function AuthCodeErrorPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session found on error page, redirecting...");
          const searchParams = new URLSearchParams(window.location.search);
          const type = searchParams.get('type');
          
          if (type === 'recovery' || window.location.hash.includes("type=recovery")) {
            router.replace("/dashboard/settings/password");
          } else if (type === 'signup' || type === 'invite') {
            router.replace("/auth/confirm");
          } else {
            router.replace("/dashboard");
          }
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setChecking(false);
      }
    };

    const timeout = setTimeout(() => {
      if (checking) {
        console.warn("Session check timed out");
        setChecking(false);
      }
    }, 5000);

    checkSession();
    return () => clearTimeout(timeout);
  }, [router, checking]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <span className="text-lg font-medium text-neutral-600 dark:text-neutral-400">Verifying your account...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">
          Authentication Error
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          We couldn&apos;t verify your account link. This usually happens if the link has expired or was already used.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login">
            <Button className="w-full">Sign in to your account</Button>
          </Link>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200 dark:border-neutral-800" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-neutral-50 px-2 text-neutral-500 dark:bg-neutral-950">Still having issues?</span></div>
          </div>

          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400">
              Clear session & Try again
            </Button>
          </form>

          <Link href="/">
            <Button variant="ghost" className="w-full">Go to homepage</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
