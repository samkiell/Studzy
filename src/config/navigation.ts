import { 
  LayoutDashboard, 
  BookOpen, 
  Brain, 
  User, 
  Settings 
} from "lucide-react";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: any; // Lucide icon component
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
    label: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
