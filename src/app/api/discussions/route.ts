import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { discussions } from "@/lib/db/schema/activity";
import { users } from "@/lib/db/schema/auth";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    const data = await db
      .select({
        id: discussions.id,
        resource_id: discussions.resource_id,
        user_id: discussions.user_id,
        content: discussions.content,
        parent_id: discussions.parent_id,
        created_at: discussions.created_at,
        updated_at: discussions.updated_at,
        profiles: {
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(discussions)
      .leftJoin(users, eq(discussions.user_id, users.id))
      .where(eq(discussions.resource_id, resourceId))
      .orderBy(asc(discussions.created_at));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceId, content, parentId } = await req.json();

    if (!resourceId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [created] = await db
      .insert(discussions)
      .values({
        resource_id: resourceId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Discussion ID is required" }, { status: 400 });
    }

    await db.delete(discussions).where(eq(discussions.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
