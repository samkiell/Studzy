"use client";

import { useState } from "react";
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
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Content Area */}
      <div 
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Mobile Header */}
        <DashboardHeader user={user} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl min-h-[calc(100vh-8rem)]">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
