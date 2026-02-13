"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface RecentResource {
  id: string;
  title: string;
  type: "video" | "audio" | "pdf";
  course_code: string;
  course_id: string;
  last_accessed: string;
}

export function ContinueStudying() {
  const [resources, setResources] = useState<RecentResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentResources() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch recent activity with resource and course info
      const { data: activities } = await supabase
        .from("user_activity")
        .select(`
          resource_id,
          last_accessed,
          resources (
            id,
            title,
            type,
            course_id,
            courses (
              code
            )
          )
        `)
        .eq("user_id", user.id)
        .order("last_accessed", { ascending: false })
        .limit(3);

      if (activities) {
        const recent = activities
          .filter((a: any) => a.resources)
          .map((a: any) => ({
            id: a.resources.id,
            title: a.resources.title,
            type: a.resources.type,
            course_id: a.resources.course_id,
            course_code: a.resources.courses?.code || "Unknown",
            last_accessed: a.last_accessed,
          }));
        setResources(recent);
      }
      setLoading(false);
    }

    fetchRecentResources();
  }, []);

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white sm:text-xl">
          Continue Studying
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </section>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  const typeIcons = {
    video: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    audio: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
    pdf: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  };

  const typeColors = {
    video: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    audio: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    pdf: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white sm:text-xl">
        Continue Studying
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Link
            key={resource.id}
            href={`/resource/${resource.id}`}
            className="group flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${typeColors[resource.type]}`}
            >
              {typeIcons[resource.type]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {resource.course_code}
              </p>
              <h3 className="truncate font-medium text-neutral-900 dark:text-white">
                {resource.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {formatTimeAgo(resource.last_accessed)}
              </p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString();
}
