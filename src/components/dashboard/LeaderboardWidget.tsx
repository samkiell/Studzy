"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeaderboardEntry {
  id: string;
  username: string;
  total_study_seconds: number;
  avatar_url?: string;
}

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, total_study_seconds, avatar_url")
        .order("total_study_seconds", { ascending: false })
        .limit(5);

      if (!error && data) {
        setEntries(data as LeaderboardEntry[]);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [supabase]);

  if (loading) return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 animate-pulse">
      <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded"></div>)}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="font-bold text-neutral-900 dark:text-white">Top Learners</h3>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                {index < 3 && (
                  <div className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                    index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : "bg-amber-600"
                  }`}>
                    {index + 1}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">
                  {entry.username || "Anonymous"}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {Math.floor(entry.total_study_seconds / 3600)}h {Math.floor((entry.total_study_seconds % 3600) / 60)}m studied
                </p>
              </div>
            </div>
            {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}
