import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema/activity";
import { resources, courses } from "@/lib/db/schema/courses";
import { eq, and, ne, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const activities = await db
      .select({
        resource_id: userActivity.resource_id,
        created_at: userActivity.created_at,
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        type: resources.type,
        course_id: resources.course_id,
        course_code: courses.code,
      })
      .from(userActivity)
      .innerJoin(resources, eq(userActivity.resource_id, resources.id))
      .leftJoin(courses, eq(resources.course_id, courses.id))
      .where(
        and(
          eq(userActivity.user_id, user.id),
          eq(userActivity.action_type, "view_resource"),
          ne(resources.type, "question_bank")
        )
      )
      .orderBy(desc(userActivity.created_at))
      .limit(10);

    const uniqueResources = new Map();
    activities.forEach((a) => {
      if (a.id && !uniqueResources.has(a.id)) {
        uniqueResources.set(a.id, {
          id: a.id,
          title: a.title,
          slug: a.slug,
          type: a.type,
          course_id: a.course_id,
          course_code: a.course_code || "Unknown",
          created_at: a.created_at ? new Date(a.created_at).toISOString() : "",
        });
      }
    });

    return NextResponse.json({ data: Array.from(uniqueResources.values()).slice(0, 3) });
  } catch (error: any) {
    console.error("Recent resources API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
