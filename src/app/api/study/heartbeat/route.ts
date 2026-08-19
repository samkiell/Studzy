import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { studyPresence } from "@/lib/db/schema/activity";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { courseId } = await req.json().catch(() => ({}));
    
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // --- Streak & Presence Logic ---
    const today = new Date().toISOString().split('T')[0];
    
    let newStreak = user.current_streak || 0;
    let newLastLogin = user.last_login_date;
    let newLongest = user.longest_streak || 0;

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

    // Update study time atomically and streaks
    const now = new Date();
    await db
      .update(users)
      .set({
        total_study_seconds: sql`COALESCE(${users.total_study_seconds}, 0) + 10`,
        current_streak: newStreak,
        last_login_date: newLastLogin,
        last_login: now,
        longest_streak: newLongest,
        updated_at: now,
      })
      .where(eq(users.id, user.id));

    // --- Study Presence (Real-time Buddies) ---
    // Only track presence for non-admin students
    if (user.role !== "admin" && courseId) {
      const [existingPresence] = await db
        .select({ user_id: studyPresence.user_id })
        .from(studyPresence)
        .where(
          and(
            eq(studyPresence.user_id, user.id),
            eq(studyPresence.course_id, courseId)
          )
        )
        .limit(1);

      if (existingPresence) {
        await db
          .update(studyPresence)
          .set({ last_pulse: now })
          .where(
            and(
              eq(studyPresence.user_id, user.id),
              eq(studyPresence.course_id, courseId)
            )
          );
      } else {
        await db.insert(studyPresence).values({
          user_id: user.id,
          course_id: courseId,
          last_pulse: now,
        });
      }
    } else if (user.role === "admin") {
      // Clean up any stale admin presence records
      await db
        .delete(studyPresence)
        .where(eq(studyPresence.user_id, user.id));
    }

    return NextResponse.json({ success: true, streak: newStreak });
  } catch (error: any) {
    console.error(`[Heartbeat] CRITICAL Heartbeat error:`, error);
    return NextResponse.json({ 
      success: false, 
      message: error?.message || "Failed to log study time" 
    }, { status: 500 });
  }
}
