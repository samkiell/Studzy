import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { userId, role, status } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    await db.update(users).set(updateData).where(eq(users.id, userId));
    
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to update user" }, { status: 500 });
  }
}
