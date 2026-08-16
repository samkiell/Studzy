import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema/chat";
import { eq, and, asc } from "drizzle-orm";

// GET /api/ai/sessions/[sessionId] — get session with messages
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch session
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.user_id, user.id)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch messages
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.session_id, sessionId))
      .orderBy(asc(chatMessages.created_at));

    return NextResponse.json({ session, messages: messages || [] });
  } catch (error) {
    console.error("Session GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/ai/sessions/[sessionId] — update session title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date() };
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.is_starred !== undefined) updates.is_starred = body.is_starred;
    if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned;

    const [session] = await db
      .update(chatSessions)
      .set(updates)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.user_id, user.id)
        )
      )
      .returning();

    if (!session) {
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/ai/sessions/[sessionId] — delete session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .delete(chatSessions)
      .where(
        and(
          eq(chatSessions.id, sessionId),
          eq(chatSessions.user_id, user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
