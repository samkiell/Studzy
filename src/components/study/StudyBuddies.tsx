"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface StudyBuddiesProps {
  courseId: string;
}

export function StudyBuddies({ courseId }: StudyBuddiesProps) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/study/buddies?courseId=${encodeURIComponent(courseId)}`);
        const data = await res.json();
        if (typeof data.count === "number") {
          setCount(data.count);
        }
      } catch (err) {
        console.error("Failed to load study buddies count:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [courseId]);

  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
      <Users className="h-3.5 w-3.5 animate-pulse" />
      <span>{count} students studying now</span>
    </div>
  );
}
