import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProgress } from "@/lib/db/schema/activity";
import { resources } from "@/lib/db/schema/courses";
import { eq, and, inArray, sql } from "drizzle-orm";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Upsert progress record
    const [existing] = await db
      .select({ id: userProgress.id })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.user_id, user.id),
          eq(userProgress.resource_id, resourceId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(userProgress)
        .set({
          completed: true,
          completed_at: new Date(),
        })
        .where(eq(userProgress.id, existing.id));
    } else {
      await db.insert(userProgress).values({
        user_id: user.id,
        resource_id: resourceId,
        completed: true,
        completed_at: new Date(),
      });
    }

    // Increment completion_count in resources table
    await db
      .update(resources)
      .set({
        completion_count: sql`COALESCE(${resources.completion_count}, 0) + 1`,
      })
      .where(eq(resources.id, resourceId));

    // Log activity
    await logActivity("complete_resource", resourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-complete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const courseId = searchParams.get("courseId");

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get progress for a single resource
    if (resourceId) {
      const [data] = await db
        .select({ completed: userProgress.completed })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.user_id, user.id),
            eq(userProgress.resource_id, resourceId)
          )
        )
        .limit(1);

      return NextResponse.json({ completed: data?.completed || false });
    }

    // Get progress for all resources in a course
    if (courseId) {
      const courseResources = await db
        .select({ id: resources.id })
        .from(resources)
        .where(eq(resources.course_id, courseId));

      if (!courseResources || courseResources.length === 0) {
        return NextResponse.json({ completed: [], total: 0 });
      }

      const resourceIds = courseResources.map((r) => r.id);

      const progress = await db
        .select({ resource_id: userProgress.resource_id })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.user_id, user.id),
            inArray(userProgress.resource_id, resourceIds),
            eq(userProgress.completed, true)
          )
        );

      return NextResponse.json({
        completed: progress.map((p) => p.resource_id),
        total: courseResources.length,
      });
    }

    return NextResponse.json(
      { error: "resourceId or courseId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in mark-complete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
