import { db } from "@/lib/db";
import { users as usersTable } from "@/lib/db/schema/auth";
import { userProgress } from "@/lib/db/schema/activity";
import { resources } from "@/lib/db/schema/courses";
import { desc, eq } from "drizzle-orm";
import { AdminUserTable } from "@/components/admin/AdminUserTable";
import { Users, UserPlus, UserCheck, Activity } from "lucide-react";

export default async function AdminUsersPage() {
  // Fetch profiles and user_progress for stats
  const allUsers = await db
    .select()
    .from(usersTable)
    .orderBy(desc(usersTable.created_at));

  const progress = await db
    .select({
      user_id: userProgress.user_id,
      course_id: resources.course_id,
    })
    .from(userProgress)
    .leftJoin(resources, eq(userProgress.resource_id, resources.id));

  // Calculate enrolled courses per user
  const progressMap = new Map<string, Set<string>>();
  if (progress) {
    progress.forEach((p) => {
      const courseId = p.course_id;
      if (courseId && p.user_id) {
        if (!progressMap.has(p.user_id)) {
          progressMap.set(p.user_id, new Set());
        }
        progressMap.get(p.user_id)?.add(courseId);
      }
    });
  }

  const users = (allUsers || []).map((p) => ({
    ...p,
    courses_enrolled: progressMap.get(p.id)?.size || 0,
  }));
  
  const displayUsers = users;

  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.status === "active" && u.is_verified).length;
  const unverifiedUsers = users.filter((u) => u.status === "active" && !u.is_verified).length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Monitor activity and control access for all Studzy members
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Verified", value: verifiedUsers, icon: UserCheck, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
          { label: "Unverified", value: unverifiedUsers, icon: UserPlus, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
          { label: "Suspended", value: suspendedUsers, icon: Activity, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminUserTable users={displayUsers as any} />
    </div>
  );
}
