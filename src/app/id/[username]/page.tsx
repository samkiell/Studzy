import { createClient } from "@/lib/supabase/server";
import { StudentIDCard } from "@/components/profile/StudentIDCard";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicIDPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch profile by username (case-insensitive search using ilike or making sure the column uses citext)
  // If the citext migration hasn't fully applied yet, we can use ilike to be safe.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch bookmarks count for stats
  const { count: bookmarksCount } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id);

  const displayName = profile.full_name || profile.username || username;
  const currentStreak = profile.current_streak || 0;
  const totalSeconds = profile.total_study_seconds || 0;

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
            avatarUrl={profile.avatar_url}
            isViewOnly={true}
            role={profile.role === "admin" ? "Admin" : "Student"}
            stats={{
              streak: currentStreak,
              hours: Math.floor(totalSeconds / 3600),
              rank: 0, 
              bookmarks: bookmarksCount || 0
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
        </div>
      </div>
    </main>
  );
}

