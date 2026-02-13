import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  Activity, 
  BookOpen, 
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

export default async function UserDetailsPage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const supabase = await createClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch user progress (courses enrolled calculation based on unique courses in progress)
  const { data: progress } = await supabase
    .from("user_progress")
    .select("resource_id, resources(course_id)")
    .eq("user_id", userId);

  const uniqueCourses = new Set(progress?.map(p => (p.resources as any)?.course_id).filter(Boolean));

  // Fetch recent activity
  const { data: activity } = await supabase
    .from("user_activity")
    .select(`
      id,
      action_type,
      created_at,
      metadata,
      resources (
        title
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // AI Usage Count
  const aiUsage = activity?.filter(a => a.action_type.startsWith('ai_')) || [];

  const stats = [
    { label: "Courses Enrolled", value: uniqueCourses.size, icon: BookOpen, color: "text-blue-600" },
    { label: "Resources Viewed", value: activity?.filter(a => a.action_type === 'view_resource').length || 0, icon: Activity, color: "text-purple-600" },
    { label: "AI Interactions", value: aiUsage.length, icon: MessageSquare, color: "text-green-600" },
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link 
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Users
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                {(profile.full_name || profile.email || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{profile.full_name || "Anonymous User"}</h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    profile.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile.role}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Last login {formatDate(profile.last_login)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{stat.label}</span>
                </div>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-500" />
              Recent Activity
            </h3>
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {activity && activity.length > 0 ? (
                  activity.map((act) => (
                    <div key={act.id} className="flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        act.action_type === 'view_resource' ? 'bg-blue-50 text-blue-600' :
                        act.action_type === 'complete_resource' ? 'bg-green-50 text-green-600' :
                        act.action_type.startsWith('ai_') ? 'bg-purple-50 text-purple-600' :
                        'bg-neutral-50 text-neutral-600'
                      } dark:bg-opacity-10`}>
                        {act.action_type === 'view_resource' ? <Eye className="h-4 w-4" /> :
                         act.action_type === 'complete_resource' ? <ShieldCheck className="h-4 w-4" /> :
                         <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {act.action_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {(act.resources as any)?.title || "System Activity"}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase">
                          {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {new Date(act.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-neutral-500">No activity recorded for this user</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
