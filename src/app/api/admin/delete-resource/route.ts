import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json({ success: false, message: "Resource ID required" }, { status: 400 });
    }

    await db.delete(resources).where(eq(resources.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Delete failed" }, { status: 500 });
  }
}
