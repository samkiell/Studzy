import { db } from "@/lib/db";
import { userActivity, userProgress, studyPresence } from "@/lib/db/schema/activity";
import { bookmarks, resources } from "@/lib/db/schema/courses";
import { chatMessages, chatSessions } from "@/lib/db/schema/chat";
import { users } from "@/lib/db/schema/auth";

/**
 * PRODUCTION LAUNCH CLEANUP
 * 
 * Clears tracking data, activity logs, and chat history using Drizzle.
 */
export async function performLaunchCleanup() {
  console.log("\n[LAUNCH CLEANUP] --- Starting Database Cleanup ---");

  try {
    // 1. Clear Tracking & Activity Tables
    await db.delete(userActivity);
    await db.delete(userProgress);
    await db.delete(studyPresence);
    await db.delete(bookmarks);
    await db.delete(chatMessages);
    await db.delete(chatSessions);

    // 2. Reset Resource Stats
    await db.update(resources).set({
      view_count: 0,
      completion_count: 0,
    });

    // 3. Reset User Profile Stats
    await db.update(users).set({
      total_study_seconds: 0,
      current_streak: 0,
      longest_streak: 0,
      last_login_date: null,
    });

    console.log("[LAUNCH CLEANUP] --- Cleanup Complete! --- \n");
    return { success: true };
  } catch (err: any) {
    console.error("[LAUNCH CLEANUP] ❌ Unexpected error during cleanup:", err.message);
    return { success: false, error: err.message };
  }
}
