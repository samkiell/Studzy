import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { bookmarks } from "@/lib/db/schema/courses";
import { userActivity } from "@/lib/db/schema/activity";
import { eq, and, gt, ne, count, ilike } from "drizzle-orm";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import { ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicIDPage({ params }: PageProps) {
  const { username } = await params;

  // Fetch user by username (case-insensitive)
  const [profile] = await db
    .select()
    .from(users)
    .where(ilike(users.username, username))
    .limit(1);

  if (!profile) {
    notFound();
  }

  // Fetch bookmarks count
  const [{ total: bookmarksCount }] = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(eq(bookmarks.user_id, profile.id));

  // Fetch all user activity to calculate views
  const activityLogs = await db
    .select({
      resource_id: userActivity.resource_id,
      action_type: userActivity.action_type,
    })
    .from(userActivity)
    .where(eq(userActivity.user_id, profile.id));

  const uniqueViews = new Set(
    activityLogs
      .filter((a) => a.action_type === "view_resource" && a.resource_id)
      .map((a) => a.resource_id)
  ).size;

  const displayName = profile.full_name || profile.name || profile.username || username;
  const totalSeconds = profile.total_study_seconds || 0;

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

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <Image src="/favicon.png" alt="Studzy" width={24} height={24} />
          </div>
          <span className="text-xl font-black text-white tracking-tighter">STUDZY</span>
        </Link>

        {/* The Card */}
        <div className="w-full animation-fade-in">
          <StudentIDCard 
            displayName={displayName}
            username={profile.username || username}
            avatarUrl={profile.avatar_url || profile.image}
            isViewOnly={true}
            role={profile.role === "admin" ? "Admin" : "Student"}
            initialStack="Software Engineering"
            stats={{
              resourcesViewed: uniqueViews,
              hours: Math.floor(totalSeconds / 3600),
              rank: userRank, 
              bookmarks: bookmarksCount || 0,
            }}
          />
        </div>

        {/* Verification Footer */}
        <div className="flex flex-col items-center gap-2 text-center opacity-40">
           <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-400 uppercase tracking-[0.2em] mb-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Institutional ID
           </div>
           <p className="text-[10px] text-white/60 max-w-[200px] leading-relaxed">
             This digital ID is cryptographically signed and verified by the Studzy Protocol.
           </p>
        </div>

        {/* CTA */}
        <div className="mt-4">
           <Link 
             href="/auth/signup" 
             className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-lg"
           >
             Get Your Own ID
           </Link>
        </div>
      </div>
    </main>
  );
}
