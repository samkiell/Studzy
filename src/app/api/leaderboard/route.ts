import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { ne, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const entries = await db
      .select({
        id: users.id,
        username: users.username,
        full_name: users.full_name,
        total_study_seconds: users.total_study_seconds,
        avatar_url: users.avatar_url,
      })
      .from(users)
      .where(ne(users.role, "admin"))
      .orderBy(desc(users.total_study_seconds))
      .limit(limit);

    return NextResponse.json({ data: entries });
  } catch (error: any) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
