import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { questions } from "@/lib/db/schema/cbt";
import { eq } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

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

    // 1. Fetch resource details first
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      return NextResponse.json({ success: true, message: "Resource already deleted" });
    }

    // 2. If it is a question bank, cascade delete corresponding questions from CBT engine
    if (resource.type === "question_bank" && resource.course_id) {
      await db.delete(questions).where(eq(questions.course_id, resource.course_id));
    }

    // 3. Delete underlying file from Filebase storage if applicable
    if (resource.file_url && resource.file_url.includes("/api/storage/")) {
      const storageKey = resource.file_url.replace(/^.*\/api\/storage\//, "");
      try {
        await deleteFile(storageKey);
      } catch (storageErr) {
        console.warn("Storage file cleanup warning:", storageErr);
      }
    }

    // 4. Delete the resource record from database
    await db.delete(resources).where(eq(resources.id, resourceId));

    return NextResponse.json({ success: true, message: "Resource and associated questions deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Delete failed" }, { status: 500 });
  }
}
