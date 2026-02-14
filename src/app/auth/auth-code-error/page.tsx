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
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // If we have a session, it means the auth was actually successful 
        // (likely via implicit flow fragment which server-side callback missed).
        const searchParams = new URLSearchParams(window.location.search);
        const type = searchParams.get('type');
        
        if (type === 'recovery' || window.location.hash.includes("type=recovery")) {
          router.push("/dashboard/settings/password");
        } else if (type === 'signup') {
          router.push("/auth/confirm");
        } else {
          router.push("/dashboard");
        }
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-neutral-600 dark:text-neutral-400">Verifying session...</span>
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
          There was a problem verifying your authentication. This could be due to an expired or invalid link.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login">
            <Button className="w-full">Try signing in again</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">Go to homepage</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
