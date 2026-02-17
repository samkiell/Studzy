"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, GraduationCap } from "lucide-react";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { NavItem } from "./NavItem";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Sidebar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950 md:flex">
      {/* Logo Section */}
      <Link href="/dashboard" className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
          <GraduationCap className="h-6 w-6" />
        </div>
        <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
          Studzy
        </span>
      </Link>

      {/* Navigation Section */}
      <div className="flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
          Main Menu
        </p>
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-neutral-100 pt-6 dark:border-neutral-900">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
        >
          <LogOut className={`h-5 w-5 transition-transform duration-200 ${isLoggingOut ? "animate-pulse" : "group-hover:-translate-x-1"}`} />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}
