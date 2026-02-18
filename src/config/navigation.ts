import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  User, 
  Zap,
  ShieldCheck
} from "lucide-react";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: any; // Lucide icon component
  adminOnly?: boolean;
}

export const NAVIGATION_ITEMS: NavItemConfig[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    label: "CBT",
    href: "/cbt",
    icon: Brain,
  },
  {
    label: "StudzyAI",
    href: "/studzyai",
    icon: Zap,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Admin",
    href: "/admin",
    icon: ShieldCheck,
    adminOnly: true,
  },
];
