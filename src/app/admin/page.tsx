import Link from "next/link";
import AdminAutoRefresh from "@/components/admin/AdminAutoRefresh";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, resources } from "@/lib/db/schema/courses";
import { users } from "@/lib/db/schema/auth";
import { studyPresence } from "@/lib/db/schema/activity";
import { count, countDistinct, gt, desc, eq, ne, and, sql } from "drizzle-orm";
import { 
  ShieldCheck, 
  CloudUpload, 
  ClipboardCheck, 
  Clock,
  BookOpen,
  FileText,
  Eye,
  Users,
  BrainCircuit,
  Database
} from "lucide-react";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  const now = new Date();
  const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const onlineFilter = and(
    gt(studyPresence.last_pulse, fiveMinsAgo),
    ne(users.role, "admin"),
    currentUser ? ne(users.id, currentUser.id) : undefined
  );

  const [
    [{ total: coursesCount }],
    [{ total: resourcesCount }],
    [{ total: usersCount }],
    [{ total: onlineUsersCount }],
    resourceStats,
    onlineUsersList,
    recentResources
  ] = await Promise.all([
    db.select({ total: count() }).from(courses),
    db.select({ total: count() }).from(resources),
    db.select({ total: count() }).from(users),
    db
      .select({ total: countDistinct(studyPresence.user_id) })
      .from(studyPresence)
      .innerJoin(users, eq(studyPresence.user_id, users.id))
      .where(onlineFilter),
    db.select({ view_count: resources.view_count, completion_count: resources.completion_count }).from(resources),
    db
      .select({
        last_pulse: studyPresence.last_pulse,
        user: {
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(studyPresence)
      .innerJoin(users, eq(studyPresence.user_id, users.id))
      .where(onlineFilter)
      .orderBy(desc(studyPresence.last_pulse))
      .limit(10),
    db
      .select({
        id: resources.id,
        title: resources.title,
        type: resources.type,
        created_at: resources.created_at,
        file_url: resources.file_url,
        course_code: courses.code,
      })
      .from(resources)
      .leftJoin(courses, eq(resources.course_id, courses.id))
      .orderBy(desc(resources.created_at))
      .limit(5)
  ]);

  const totalViews = (resourceStats || []).reduce((acc, r) => acc + (r.view_count || 0), 0);

  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return "No uploads yet";
    const date = new Date(dateValue);
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
    { 
      label: "Online Users", 
      value: onlineUsersCount || 0, 
      icon: Users, 
      color: "text-emerald-600", 
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      isPulse: (onlineUsersCount || 0) > 0
    },
  ];

  return (
    <div className="space-y-10">
      <AdminAutoRefresh />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{stat.value.toLocaleString()}</p>
                    {stat.isPulse && (
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                </div>
                <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[
            { href: "/admin/upload", label: "Upload", desc: "Add new materials", icon: CloudUpload, bg: "bg-primary-100", color: "text-primary-600" },
            { href: "/admin/resources", label: "Content", desc: "Edit resources", icon: ClipboardCheck, bg: "bg-amber-100", color: "text-amber-600" },
            { href: "/admin/rag", label: "AI Knowledge", desc: "Sync semantic data", icon: BrainCircuit, bg: "bg-purple-100", color: "text-purple-600" },
            { href: "/admin/courses", label: "Courses", desc: "Edit code/title/desc", icon: BookOpen, bg: "bg-blue-100", color: "text-blue-600" },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-primary-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
            >
              <div className={`mb-3 sm:mb-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg ${action.bg} ${action.color} dark:bg-opacity-20`}>
                <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">{action.label}</h3>
              <p className="mt-1 text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">{action.desc}</p>
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
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden ${
                    resource.type === "video" ? "bg-red-50 text-red-600" : 
                    resource.type === "audio" ? "bg-purple-50 text-purple-600" : 
                    resource.type === "image" ? "bg-emerald-50 text-emerald-600" :
                    "bg-blue-50 text-blue-600"
                  } dark:bg-opacity-10`}>
                    {resource.type === "image" ? (
                      <img src={resource.file_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-neutral-900 dark:text-white truncate">{resource.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{resource.course_code} &bull; {resource.type.toUpperCase()}</p>
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

        {/* Online Users List */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Currently Online</h2>
            <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {onlineUsersList?.map((presence: any) => {
                const user = presence.user;
                return (
                  <div key={user.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (user.username?.[0] || user.full_name?.[0] || user.email?.[0] || "U").toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                        {user.username || user.full_name || "New Student"}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Online now
                      </span>
                      <p className="text-[10px] text-neutral-400">{formatDate(presence.last_pulse)}</p>
                    </div>
                  </div>
                );
              })}
              {(!onlineUsersList || onlineUsersList.length === 0) && (
                <div className="p-10 text-center">
                  <p className="text-sm text-neutral-500">No users currently online</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
