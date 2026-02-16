import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { courseId } = await req.json().catch(() => ({}));
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // --- Streak & Presence Logic ---
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch profile for study time and streak logic
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_login_date, longest_streak, total_study_seconds')
      .eq('id', user.id)
      .single();

    if (profile) {
      let newStreak = profile.current_streak || 0;
      let newLastLogin = profile.last_login_date;
      let newLongest = profile.longest_streak || 0;
      const currentSeconds = profile.total_study_seconds || 0;

      if (!newLastLogin) {
        newStreak = 1;
        newLastLogin = today;
      } else {
        const last = new Date(newLastLogin);
        const curr = new Date(today);
        const diffDays = Math.floor((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
          newLastLogin = today;
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
          newLastLogin = today;
        }
      }

      if (newStreak > newLongest) {
        newLongest = newStreak;
      }

      // Update profile with study time and streak info
      await supabase
        .from('profiles')
        .update({
          total_study_seconds: currentSeconds + 10,
          current_streak: newStreak,
          last_login_date: newLastLogin,
          longest_streak: newLongest
        })
        .eq('id', user.id);
    }

    // --- Study Presence (Real-time Buddies) ---
    if (courseId) {
      await supabase
        .from('study_presence')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          last_pulse: new Date().toISOString()
        }, {
          onConflict: 'user_id, course_id'
        });
    }

    return NextResponse.json({ success: true, streak: profile?.current_streak });
  } catch (error) {
    console.error("Study heartbeat error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to log study time" 
    }, { status: 500 });
  }
}
