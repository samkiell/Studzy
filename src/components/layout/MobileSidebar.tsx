"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, LogOut } from "lucide-react";
import Link from "next/link";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { NavItem } from "./NavItem";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-6 shadow-2xl dark:bg-neutral-950 md:hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="text-lg font-black text-neutral-900 dark:text-white">
                  Studzy
                </span>
              </Link>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {NAVIGATION_ITEMS.map((item) => (
                <NavItem key={item.href} {...item} onClick={onClose} />
              ))}
            </nav>

            <div className="mt-auto border-t border-neutral-100 pt-6 dark:border-neutral-900">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
              >
                <LogOut className="h-5 w-5" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
