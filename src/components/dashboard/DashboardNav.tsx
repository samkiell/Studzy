"use client";

import { useState } from "react";
import Link from "next/link";
import { SmartLink } from "@/components/ui/SmartLink";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { User } from "@supabase/supabase-js";

interface DashboardNavProps {
  user: User | null;
  isAdmin?: boolean;
}

export function DashboardNav({ user, isAdmin = false }: DashboardNavProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false);
    }
  };

  return (
    <nav className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <SmartLink href="/dashboard" className="flex items-center gap-2">
            <Image src="/favicon.png" alt="Studzy" width={28} height={28} />
            <span className="text-xl font-bold text-primary-600">Studzy</span>
          </SmartLink>
          <div className="flex items-center gap-3 sm:gap-4">
            <SmartLink 
              href="/dashboard" 
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              Dashboard
            </SmartLink>
            {isAdmin && (
              <SmartLink 
                href="/admin"
                className="flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-[11px] sm:text-sm font-bold sm:font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Admin
              </SmartLink>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {user.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing out...
                  </span>
                ) : (
                  "Sign out"
                )}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <SmartLink href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </SmartLink>
              <SmartLink href="/signup">
                <Button size="sm">Sign up</Button>
              </SmartLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
