import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { eq, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { success: false, message: "Resource ID required" },
        { status: 400 }
      );
    }

    // Increment view_count atomically in Drizzle
    await db
      .update(resources)
      .set({
        view_count: sql`COALESCE(${resources.view_count}, 0) + 1`,
      })
      .where(eq(resources.id, resourceId));

    // Log activity
    await logActivity("view_resource", resourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to track view",
      },
      { status: 500 }
    );
  }
}
