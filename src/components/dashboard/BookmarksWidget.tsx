"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, FileText, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal, useModal } from "@/components/ui/Modal";

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
  const [allBookmarks, setAllBookmarks] = useState<BookmarkedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasFetchedAll, setHasFetchedAll] = useState(false);
  const supabase = createClient();
  const modal = useModal();

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

  const handleOpenModal = async () => {
    modal.open();
    if (hasFetchedAll) return;

    setLoadingAll(true);
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
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAllBookmarks(data as any as BookmarkedResource[]);
      setHasFetchedAll(true);
    }
    setLoadingAll(false);
  };

  if (loading) return <div className="h-48 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"></div>;
  if (bookmarks.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary-600" />
          <h3 className="font-bold text-neutral-900 dark:text-white">Starred Resources</h3>
        </div>
        <button 
          onClick={handleOpenModal}
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          View All
        </button>
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
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[180px]">
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

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="Starred Resources"
        description="A list of all the materials you've starred for quick access."
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {loadingAll ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              <p className="text-sm text-neutral-500">Fetching your stars...</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allBookmarks.map((bookmark) => (
                <Link
                  key={bookmark.id}
                  href={`/course/${bookmark.resources.courses.code}/resource/${bookmark.resources.slug}`}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 p-4 transition-all hover:border-primary-200 hover:bg-primary-50/30 dark:border-neutral-800 dark:hover:border-primary-900/20 dark:hover:bg-primary-900/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 dark:text-white line-clamp-1">
                        {bookmark.resources.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500">
                          {bookmark.resources.courses.code}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                        <span className="text-[10px] text-neutral-400 capitalize">
                          {bookmark.resources.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
