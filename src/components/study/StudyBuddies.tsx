"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StudyBuddiesProps {
  courseId: string;
}

export function StudyBuddies({ courseId }: StudyBuddiesProps) {
  const [count, setCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchCount = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: buddyCount, error } = await supabase
        .from("study_presence")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)
        .gt("last_pulse", fiveMinutesAgo);

      if (!error && buddyCount !== null) {
        setCount(buddyCount);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [courseId, supabase]);

  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
      <Users className="h-3.5 w-3.5 animate-pulse" />
      <span>{count} students studying now</span>
    </div>
  );
}
