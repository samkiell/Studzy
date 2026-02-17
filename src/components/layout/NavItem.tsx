"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface NavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  onClick?: void | (() => void); // Consistent type
  isCollapsed?: boolean;
}

export function NavItem({ label, href, icon: Icon, onClick, isCollapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={typeof onClick === 'function' ? onClick : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-neutral-200"
      } ${isCollapsed ? "justify-center px-2" : ""}`}
      title={isCollapsed ? label : ""}
    >
      <Icon
        className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
          isActive ? "text-primary-600 dark:text-primary-400" : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
        }`}
      />
      
      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}

      {isActive && !isCollapsed && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
      )}

      {isActive && isCollapsed && (
        <div className="absolute left-0 h-6 w-1 rounded-r-full bg-primary-600 dark:bg-primary-400" />
      )}
    </Link>
  );
}
