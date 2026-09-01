import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { count, gt, ne, and } from "drizzle-orm";
import { LeaderboardClient } from "./LeaderboardClient";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const totalSeconds = user.total_study_seconds || 0;

  // Fetch rank based on study time among non-admins
  const [{ total: higherRankCount }] = await db
    .select({ total: count() })
    .from(users)
    .where(
      and(
        gt(users.total_study_seconds, totalSeconds),
        ne(users.role, "admin")
      )
    );

  const userRank = totalSeconds > 0 ? (higherRankCount || 0) + 1 : 0;
  const username = user.username || user.name?.split(" ")[0] || user.email?.split("@")[0] || "student";

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Global Leaderboard
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            See how you stack up against other students.
          </p>
        </div>
      </div>

      <LeaderboardClient 
        currentUserId={user.id}
        currentUserRank={userRank}
        currentUserTotalSeconds={totalSeconds}
        currentUserAvatar={user.avatar_url || user.image || undefined}
        currentUsername={username}
        currentUserCurrentStreak={user.current_streak || 0}
        currentUserLongestStreak={user.longest_streak || 0}
      />
    </div>
  );
}
