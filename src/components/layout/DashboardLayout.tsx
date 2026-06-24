"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Footer } from "@/components/ui/Footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    email?: string;
  };
  role?: string;
}

export function DashboardLayout({ children, user, role }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Hide footer + remove padding on CBT attempt pages (fullscreen quiz UI)
  const isCbtAttempt = /^\/cbt\/[^/]+$/.test(pathname);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)} 
        role={role}
      />

      {/* Main Content Area */}
      <div 
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Mobile Header */}
        <DashboardHeader user={user} role={role} />

        <main className={`flex-1 ${isCbtAttempt ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10'}`}>
          <div className={isCbtAttempt ? 'h-full' : 'mx-auto max-w-7xl min-h-[calc(100vh-8rem)]'}>
            {children}
          </div>
          {!isCbtAttempt && <Footer />}
        </main>
      </div>
    </div>
  );
}
