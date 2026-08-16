import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studyPresence } from "@/lib/db/schema/activity";
import { eq, and, gt, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ count: 0 });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [{ total }] = await db
      .select({ total: count() })
      .from(studyPresence)
      .where(
        and(
          eq(studyPresence.course_id, courseId),
          gt(studyPresence.last_pulse, fiveMinutesAgo)
        )
      );

    return NextResponse.json({ count: total || 0 });
  } catch (error: any) {
    console.error("Study buddies API error:", error);
    return NextResponse.json({ count: 0 });
  }
}
