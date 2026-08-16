import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { and, eq, lt } from "drizzle-orm";

/**
 * Cleanup function to delete unverified users older than X days.
 */
export async function cleanupUnverifiedUsers(daysOld = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  console.log(`Cleaning up users unverified since ${cutoffDate.toISOString()}`);

  try {
    await db
      .delete(users)
      .where(
        and(
          eq(users.is_verified, false),
          lt(users.created_at, cutoffDate)
        )
      );

    return { success: true, message: "Unverified users cleaned up successfully" };
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return { success: false, error: error.message };
  }
}
