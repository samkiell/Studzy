"use client";

import { useEffect, useState } from "react";
import { Medal, User, Flame, Clock } from "lucide-react";
import { LeaderboardEntry } from "@/components/dashboard/LeaderboardWidget";

interface LeaderboardClientProps {
  currentUserId: string;
  currentUserRank: number;
  currentUserTotalSeconds: number;
  currentUserAvatar?: string;
  currentUsername: string;
  currentUserCurrentStreak: number;
  currentUserLongestStreak: number;
}

export function LeaderboardClient({
  currentUserId,
  currentUserRank,
  currentUserTotalSeconds,
  currentUserAvatar,
  currentUsername,
  currentUserCurrentStreak,
  currentUserLongestStreak,
}: LeaderboardClientProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/leaderboard?limit=${LIMIT}&offset=${offset}`);
        const data = await res.json();

        if (data.data) {
          if (offset === 0) {
            setEntries(data.data as LeaderboardEntry[]);
          } else {
            setEntries((prev) => [...prev, ...data.data as LeaderboardEntry[]]);
          }
          setHasMore(data.data.length === LIMIT);
        }
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchLeaderboard();
  }, [offset]);

  const handleLoadMore = () => {
    setIsFetchingMore(true);
    setOffset((prev) => prev + LIMIT);
  };

  const currentUserInList = entries.some((e) => e.id === currentUserId);
  const showCurrentUserAppended = currentUserId && !currentUserInList && currentUserRank > 0;

  if (loading && offset === 0) return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>)}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <tr>
              <th scope="col" className="px-6 py-4 font-semibold">Rank</th>
              <th scope="col" className="px-6 py-4 font-semibold">Student</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Time Studied</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Current Streak</th>
              <th scope="col" className="px-6 py-4 font-semibold text-center">Longest Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {entries.map((entry, index) => (
              <tr 
                key={entry.id} 
                className={`transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                  entry.id === currentUserId ? "bg-primary-50/50 dark:bg-primary-900/10" : "bg-white dark:bg-neutral-900"
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4 font-medium text-neutral-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {index === 0 ? <Medal className="h-5 w-5 text-yellow-500" /> : 
                     index === 1 ? <Medal className="h-5 w-5 text-slate-400" /> : 
                     index === 2 ? <Medal className="h-5 w-5 text-amber-600" /> : 
                     <span className="w-5 text-center text-neutral-500">{index + 1}</span>}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt={entry.username} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold ${entry.id === currentUserId ? "text-primary-600 dark:text-primary-400" : "text-neutral-900 dark:text-white"}`}>
                        {entry.username || "Anonymous"} {entry.id === currentUserId && "(You)"}
                      </p>
                      {entry.full_name && (
                        <p className="text-xs text-neutral-500">{entry.full_name}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    <span className="font-medium">
                      {Math.floor((entry.total_study_seconds || 0) / 3600)}h {Math.floor(((entry.total_study_seconds || 0) % 3600) / 60)}m
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <Flame className="h-4 w-4" />
                    <span className="font-medium">{entry.current_streak || 0} days</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-center">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{entry.longest_streak || 0} days</span>
                </td>
              </tr>
            ))}

            {showCurrentUserAppended && (
              <>
                <tr>
                  <td colSpan={5} className="bg-neutral-50 py-2 text-center dark:bg-neutral-800/50">
                    <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">...</span>
                  </td>
                </tr>
                <tr className="bg-primary-50/50 dark:bg-primary-900/10">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-primary-600 dark:text-primary-400">{currentUserRank}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full border border-primary-200 bg-neutral-100 dark:border-primary-800 dark:bg-neutral-800">
                        {currentUserAvatar ? (
                          <img src={currentUserAvatar} alt={currentUsername} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-primary-600 dark:text-primary-400">
                          {currentUsername} (You)
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                      <Clock className="h-4 w-4 text-neutral-400" />
                      <span className="font-medium">
                        {Math.floor((currentUserTotalSeconds || 0) / 3600)}h {Math.floor(((currentUserTotalSeconds || 0) % 3600) / 60)}m
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-orange-600 dark:text-orange-400">
                      <Flame className="h-4 w-4" />
                      <span className="font-medium">{currentUserCurrentStreak} days</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{currentUserLongestStreak} days</span>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex items-center justify-center border-t border-neutral-200 p-4 dark:border-neutral-800">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingMore}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-700 disabled:opacity-50 transition-all"
          >
            {isFetchingMore ? "Loading more..." : "Load More Students"}
          </button>
        </div>
      )}
    </div>
  );
}
