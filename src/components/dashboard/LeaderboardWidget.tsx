"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export interface LeaderboardEntry {
  id: string;
  username: string;
  full_name?: string;
  total_study_seconds: number;
  avatar_url?: string;
  current_streak?: number;
  longest_streak?: number;
}

interface LeaderboardWidgetProps {
  currentUserId?: string;
  currentUserRank?: number;
  currentUserTotalSeconds?: number;
  currentUserAvatar?: string;
  currentUsername?: string;
}

export function LeaderboardWidget({
  currentUserId,
  currentUserRank,
  currentUserTotalSeconds,
  currentUserAvatar,
  currentUsername,
}: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit] = useState(10);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/leaderboard?limit=${limit}`);
        const data = await res.json();

        if (data.data) {
          setEntries(data.data as LeaderboardEntry[]);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  const currentUserInTop10 = entries.some((e) => e.id === currentUserId);
  const showCurrentUserAppended = currentUserId && !currentUserInTop10 && currentUserRank;

  if (loading) return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 animate-pulse">
      <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded"></div>)}
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
          <div 
            key={entry.id} 
            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
              entry.id === currentUserId ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800" : ""
            }`}
          >
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
                <div className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                  index === 0 ? "bg-yellow-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-amber-600" : "bg-neutral-500"
                }`}>
                  {index + 1}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">
                  {entry.username || "Anonymous"} {entry.id === currentUserId && "(You)"}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {Math.floor((entry.total_study_seconds || 0) / 3600)}h {Math.floor(((entry.total_study_seconds || 0) % 3600) / 60)}m studied
                </p>
              </div>
            </div>
            {index === 0 && <Medal className="h-5 w-5 text-yellow-500" />}
          </div>
        ))}
        
        {showCurrentUserAppended && (
          <>
            <div className="flex justify-center py-1">
              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-1"></div>
              <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-1"></div>
            </div>
            <div 
              className="flex items-center justify-between p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800">
                    {currentUserAvatar ? (
                      <img src={currentUserAvatar} alt={currentUsername || ""} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -right-2 -top-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full text-[10px] font-bold text-white bg-primary-500 shadow-sm">
                    {currentUserRank}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[120px]">
                    {currentUsername || "Anonymous"} (You)
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {Math.floor((currentUserTotalSeconds || 0) / 3600)}h {Math.floor(((currentUserTotalSeconds || 0) % 3600) / 60)}m studied
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Link
        href="/leaderboard"
        className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg border border-neutral-200 py-2.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        View Full Leaderboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
