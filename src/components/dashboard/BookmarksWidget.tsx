"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, FileText, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BookmarkedResource {
  id: string;
  resource_id: string;
  resources: {
    title: string;
    type: string;
    slug: string;
    courses: {
      code: string;
    };
  };
}

export function BookmarksWidget() {
  const [bookmarks, setBookmarks] = useState<BookmarkedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBookmarks = async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          id,
          resource_id,
          resources (
            title,
            type,
            slug,
            courses (
              code
            )
          )
        `)
        .limit(3);

      if (!error && data) {
        setBookmarks(data as any as BookmarkedResource[]);
      }
      setLoading(false);
    };

    fetchBookmarks();
  }, [supabase]);

  if (loading) return <div className="h-48 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>;
  if (bookmarks.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary-600" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Starred Resources</h3>
        </div>
        <Link href="/bookmarks" className="text-xs font-medium text-primary-600 hover:underline">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <Link
            key={bookmark.id}
            href={`/course/${bookmark.resources.courses.code}/resource/${bookmark.resources.slug}`}
            className="flex items-center justify-between rounded-lg border border-neutral-100 p-3 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {bookmark.resources.title}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {bookmark.resources.courses.code}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
