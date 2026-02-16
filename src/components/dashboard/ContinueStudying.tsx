"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Video, Music, FileText, ChevronRight } from "lucide-react";

interface RecentResource {
  id: string;
  title: string;
  slug: string;
  type: "video" | "audio" | "pdf";
  course_code: string;
  course_id: string;
  created_at: string;
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
          created_at,
          resources (
            id,
            title,
            slug,
            type,
            course_id,
            courses (
              code
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("action_type", "view_resource")
        .order("created_at", { ascending: false })
        .limit(10);

      if (activities) {
        const uniqueResources = new Map();
        
        activities.forEach((a: any) => {
          if (a.resources && !uniqueResources.has(a.resources.id)) {
            uniqueResources.set(a.resources.id, {
              id: a.resources.id,
              title: a.resources.title,
              slug: a.resources.slug,
              type: a.resources.type,
              course_id: a.resources.course_id,
              course_code: a.resources.courses?.code || "Unknown",
              created_at: a.created_at,
            });
          }
        });

        setResources(Array.from(uniqueResources.values()).slice(0, 3));
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
    video: <Video className="h-5 w-5" />,
    audio: <Music className="h-5 w-5" />,
    pdf: <FileText className="h-5 w-5" />,
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
            href={`/course/${resource.course_code}/resource/${resource.slug}`}
            className="group flex min-w-0 w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${typeColors[resource.type]}`}
            >
              {typeIcons[resource.type]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {resource.course_code}
              </p>
              <h3 className="truncate font-medium text-neutral-900 dark:text-white">
                {resource.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {formatTimeAgo(resource.created_at)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300" />
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
