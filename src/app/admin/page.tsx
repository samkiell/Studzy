import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { 
  ShieldCheck, 
  CloudUpload, 
  ClipboardCheck, 
  BarChart3, 
  LayoutDashboard, 
  Database, 
  Clock,
  BookOpen,
  FileText,
  Eye,
  Users
} from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch Stats
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: coursesCount },
    { count: resourcesCount },
    { count: usersCount },
    { count: newUsersCount },
    { count: activeUsersCount },
    { data: resourceStats }
  ] = await Promise.all([
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_login", thirtyDaysAgo),
    supabase.from("resources").select("view_count, completion_count")
  ]);

  const totalViews = (resourceStats || []).reduce((acc, r) => acc + (r.view_count || 0), 0);

  // Recent Resources (Last 5)
  const { data: recentResources } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      type,
      created_at,
      courses (code)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  const formatDate = (dateString: string) => {
    if (!dateString) return "No uploads yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const stats = [
    { label: "Total Courses", value: coursesCount || 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "Total Resources", value: resourcesCount || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
    { label: "Total Views", value: totalViews, icon: Eye, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
    { label: "Total Users", value: usersCount || 0, icon: Users, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { label: "New Users (7d)", value: newUsersCount || 0, icon: Users, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { label: "Active Users (30d)", value: activeUsersCount || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome & Stats */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <ShieldCheck className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Manage Studzy content and track performance</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/upload", label: "Upload Resource", desc: "Add new materials", icon: CloudUpload, bg: "bg-primary-100", color: "text-primary-600" },
            { href: "/admin/resources", label: "Manage Content", desc: "Edit or delete resources", icon: ClipboardCheck, bg: "bg-amber-100", color: "text-amber-600" },
            { href: "/admin/analytics", label: "Engagement", desc: "View detailed stats", icon: BarChart3, bg: "bg-blue-100", color: "text-blue-600" },
            { href: "/dashboard", label: "Preview App", desc: "View as student", icon: LayoutDashboard, bg: "bg-green-100", color: "text-green-600" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${action.bg} ${action.color} dark:bg-opacity-20`}>
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">{action.label}</h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{action.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Uploads</h2>
            <Link href="/admin/resources" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentResources?.map((resource: any) => (
                <div key={resource.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    resource.type === "video" ? "bg-red-50 text-red-600" : 
                    resource.type === "audio" ? "bg-purple-50 text-purple-600" : 
                    "bg-blue-50 text-blue-600"
                  } dark:bg-opacity-10`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 dark:text-white truncate">{resource.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{resource.courses?.code} &bull; {resource.type.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">
                      <Clock className="h-3 w-3" />
                      {formatDate(resource.created_at)}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentResources || recentResources.length === 0) && (
                <div className="p-8 text-center text-neutral-500">No resources uploaded yet</div>
              )}
            </div>
          </div>
        </section>

        {/* Database Shortcut */}
        <section className="flex flex-col">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">System Status</h2>
          <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-full flex-col justify-between space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">Supabase Connection Active</span>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Database and storage systems are operational. You can manage low-level data directly via the Supabase dashboard.
                </p>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <Database className="h-4 w-4" />
                Supabase Dashboard
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
