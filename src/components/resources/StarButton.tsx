"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface StarButtonProps {
  resourceId: string;
}

export function StarButton({ resourceId }: StarButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkBookmark = async () => {
      const res = await fetch(`/api/bookmarks?resourceId=${resourceId}`);
      if (res.ok) {
        const { bookmarked } = await res.json();
        setIsBookmarked(bookmarked);
      }
      setLoading(false);
    };
    checkBookmark();
  }, [resourceId]);

  const toggleBookmark = async () => {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });

    if (res.ok) {
      const { bookmarked } = await res.json();
      setIsBookmarked(bookmarked);
      router.refresh();
    }
  };

  if (loading) return <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />;

  return (
    <button
      onClick={toggleBookmark}
      className={`group flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
        isBookmarked
          ? "border-yellow-200 bg-yellow-50 text-yellow-500 shadow-sm dark:border-yellow-900/50 dark:bg-yellow-900/20"
          : "border-neutral-200 bg-white text-neutral-400 hover:border-yellow-200 hover:bg-yellow-50 hover:text-yellow-500 dark:border-neutral-800 dark:bg-neutral-900"
      }`}
      title={isBookmarked ? "Remove from stars" : "Star this resource"}
    >
      <Star className={`h-5 w-5 ${isBookmarked ? "fill-current" : "group-hover:fill-current"}`} />
    </button>
  );
}
