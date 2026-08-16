import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema/courses";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    // Check if bookmark exists
    const [existing] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.user_id, user.id),
          eq(bookmarks.resource_id, resourceId)
        )
      )
      .limit(1);

    if (existing) {
      // Remove it
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return NextResponse.json({ bookmarked: false });
    } else {
      // Add it
      await db.insert(bookmarks).values({
        user_id: user.id,
        resource_id: resourceId,
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ bookmarked: false });

    const [data] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.user_id, user.id),
          eq(bookmarks.resource_id, resourceId)
        )
      )
      .limit(1);

    return NextResponse.json({ bookmarked: !!data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
