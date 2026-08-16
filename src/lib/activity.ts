import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema/activity";
import { eq, and } from "drizzle-orm";

export type ActivityAction = 
  | "login" 
  | "view_resource" 
  | "complete_resource" 
  | "ai_chat" 
  | "ai_image" 
  | "ai_code";

export async function logActivity(actionType: ActivityAction, resourceId?: string, metadata: any = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { error: null };

    // Try finding existing activity record or insert new one
    const conditions = [
      eq(userActivity.user_id, user.id),
      eq(userActivity.action_type, actionType),
    ];
    if (resourceId) {
      conditions.push(eq(userActivity.resource_id, resourceId));
    }

    const [existing] = await db
      .select({ id: userActivity.id })
      .from(userActivity)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      await db
        .update(userActivity)
        .set({
          metadata,
          last_accessed: new Date(),
        })
        .where(eq(userActivity.id, existing.id));
    } else {
      await db.insert(userActivity).values({
        user_id: user.id,
        action_type: actionType,
        resource_id: resourceId || null,
        metadata,
        last_accessed: new Date(),
      });
    }

    return { error: null };
  } catch (error: any) {
    console.error("Failed to log activity:", error);
    return { error };
  }
}
