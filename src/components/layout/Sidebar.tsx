"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { NavItem } from "./NavItem";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
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
    <aside 
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-neutral-200 bg-white p-4 transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-950 md:flex ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className={`mb-10 flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-2"}`}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/20">
            <Image 
              src="/favicon.png" 
              alt="Studzy" 
              width={24} 
              height={24} 
              className="invert brightness-0" // Make it white for the primary background
            />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black tracking-tight text-neutral-900 dark:text-white"
            >
              Studzy
            </motion.span>
          )}
        </Link>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-transform hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Navigation Section */}
      <div className="flex flex-1 flex-col gap-1">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
            Main Menu
          </p>
        )}
        {NAVIGATION_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} isCollapsed={isCollapsed} />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-neutral-100 pt-6 dark:border-neutral-900">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 ${
            isCollapsed ? "justify-center px-2" : "px-3 w-full"
          }`}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isLoggingOut ? "animate-pulse" : "group-hover:-translate-x-1"}`} />
          {!isCollapsed && <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}
