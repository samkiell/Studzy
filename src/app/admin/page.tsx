import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface CourseWithLastUpload {
  id: string;
  code: string;
  title: string;
  lastUploadDate: string;
  resourceCount: number;
}

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch courses with their latest resource upload dates
  const { data: coursesWithResources } = await supabase
    .from("courses")
    .select(`
      id,
      code,
      title,
      resources (
        id,
        created_at
      )
    `)
    .order("code", { ascending: true });

  // Process courses to get last upload date and count
  const coursesWithLastUpload: CourseWithLastUpload[] = (coursesWithResources || [])
    .map((course) => {
      const resources = course.resources || [];
      const sortedResources = resources.sort(
        (a: { created_at: string }, b: { created_at: string }) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        id: course.id,
        code: course.code,
        title: course.title,
        lastUploadDate: sortedResources[0]?.created_at || "",
        resourceCount: resources.length,
      };
    })
    .filter((c) => c.resourceCount > 0)
    .sort((a, b) => new Date(b.lastUploadDate).getTime() - new Date(a.lastUploadDate).getTime())
    .slice(0, 3);

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
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 dark:border-amber-900 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <svg
              className="h-7 w-7 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Welcome, Admin!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage courses and upload learning materials
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
        Quick Actions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Upload Resource */}
        <Link
          href="/admin/upload"
          className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            Upload Resource
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Add videos, audio, or PDFs to courses
          </p>
        </Link>

        {/* View Dashboard */}
        <Link
          href="/dashboard"
          className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            View Dashboard
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Browse all courses and resources
          </p>
        </Link>

        {/* Manage Storage */}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            Supabase Dashboard
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Manage database and storage
          </p>
        </a>
      </div>

      {/* Recent Uploads Section */}
      {coursesWithLastUpload.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
            Recent Uploads
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coursesWithLastUpload.map((course) => (
              <Link
                key={course.id}
                href={`/course/${course.id}`}
                className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-lg bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {course.code}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(course.lastUploadDate)}
                  </span>
                </div>
                <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 line-clamp-2">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {course.resourceCount} resource{course.resourceCount !== 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
