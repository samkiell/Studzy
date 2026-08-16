import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { studyMaterialEmbeddings } from "@/lib/db/schema/rag";
import { resources } from "@/lib/db/schema/courses";
import { eq, ilike } from "drizzle-orm";
import { deleteFile } from "@/lib/storage";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    // 1. Delete all embeddings for this file path
    await db
      .delete(studyMaterialEmbeddings)
      .where(eq(studyMaterialEmbeddings.file_path, filePath));

    // 2. Delete from Filebase storage
    try {
      await deleteFile(filePath);
    } catch (storageError) {
      console.warn(`[RAG Delete] Failed to delete storage file: ${filePath}`, storageError);
    }

    // 3. Try to find and delete matching resource record (if any)
    try {
      await db
        .delete(resources)
        .where(ilike(resources.file_url, `%${filePath}%`));
    } catch (resourceError) {
      console.warn(`[RAG Delete] Failed to delete resource record: ${filePath}`, resourceError);
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge and source file deleted successfully",
    });
  } catch (error) {
    console.error("RAG delete error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete RAG embeddings",
    }, { status: 500 });
  }
}
