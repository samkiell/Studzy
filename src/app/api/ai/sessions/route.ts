import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatSessions } from "@/lib/db/schema/chat";
import { eq, desc } from "drizzle-orm";

// GET /api/ai/sessions — list user's chat sessions
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.user_id, user.id))
      .orderBy(desc(chatSessions.updated_at));

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("Sessions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/ai/sessions — create a new chat session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || "New Chat";

    const [session] = await db
      .insert(chatSessions)
      .values({
        user_id: user.id,
        title,
      })
      .returning();

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Sessions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
