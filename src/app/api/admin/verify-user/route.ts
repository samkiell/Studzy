import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ is_verified: true, updated_at: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User verified successfully" });
  } catch (error: any) {
    console.error("Admin Verify User Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify user" }, { status: 500 });
  }
}
