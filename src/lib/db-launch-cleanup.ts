import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PRODUCTION LAUNCH CLEANUP
 * 
 * This utility clears all tracking data, activity logs, and chat history
 * to prepare the application for a fresh launch.
 * 
 * CAUTION: This operation is IRREVERSIBLE.
 */
export async function performLaunchCleanup() {
  console.log("\n[LAUNCH CLEANUP] --- Starting Database Cleanup ---");
  const supabase = createAdminClient();

  try {
    // 1. Clear Tracking & Activity Tables
    const tablesToClear = [
      "user_activity",
      "user_progress",
      "study_presence",
      "bookmarks",
      "chat_messages",
      "chat_sessions"
    ];

    for (const table of tablesToClear) {
      console.log(`[LAUNCH CLEANUP] Clearing table: ${table}...`);
      const { error } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard bulk delete trick

      if (error) {
        console.error(`[LAUNCH CLEANUP] ❌ Failed to clear ${table}:`, error.message);
      } else {
        console.log(`[LAUNCH CLEANUP] ✅ Table ${table} cleared.`);
      }
    }

    // 2. Reset Resource Stats (View Count, Completion Count)
    console.log("[LAUNCH CLEANUP] Resetting resource view and completion counts...");
    const { error: resourceError } = await supabase
      .from("resources")
      .update({
        view_count: 0,
        completion_count: 0
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (resourceError) {
      console.error("[LAUNCH CLEANUP] ❌ Failed to reset resources:", resourceError.message);
    } else {
      console.log("[LAUNCH CLEANUP] ✅ Resource stats reset to 0.");
    }

    // 3. Reset User Profile Stats (Streaks, Study Time)
    console.log("[LAUNCH CLEANUP] Resetting user profile stats (streaks, study time)...");
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        total_study_seconds: 0,
        current_streak: 0,
        longest_streak: 0,
        last_login_date: null
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (profileError) {
      console.error("[LAUNCH CLEANUP] ❌ Failed to reset profiles:", profileError.message);
    } else {
      console.log("[LAUNCH CLEANUP] ✅ User profile stats reset.");
    }

    console.log("[LAUNCH CLEANUP] --- Cleanup Complete! --- \n");
    return { success: true };
  } catch (err: any) {
    console.error("[LAUNCH CLEANUP] ❌ Unexpected error during cleanup:", err.message);
    return { success: false, error: err.message };
  }
}
