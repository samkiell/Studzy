import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { eq, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json({ success: false, message: "Resource ID required" }, { status: 400 });
    }

    // Log activity
    const { error } = await logActivity("view_resource", resourceId);

    if (error) {
      console.error("Error tracking activity:", error);
      return NextResponse.json({ success: false, message: "Failed to log activity" }, { status: 500 });
    }

    // Increment view_count on the resource
    await db
      .update(resources)
      .set({
        view_count: sql`COALESCE(${resources.view_count}, 0) + 1`,
      })
      .where(eq(resources.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track activity error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to track activity",
    }, { status: 500 });
  }
}
