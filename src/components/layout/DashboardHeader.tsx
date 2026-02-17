"use client";

import { Menu, Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";

export function DashboardHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white/80 px-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600/10 p-1.5">
              <Image 
                src="/favicon.png" 
                alt="Studzy" 
                width={20} 
                height={20} 
              />
            </div>
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              Studzy
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <Bell className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
            S
          </div>
        </div>
      </header>

      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
