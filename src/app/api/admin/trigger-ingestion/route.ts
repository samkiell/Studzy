import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { filePath, courseCode, level } = body;

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    console.log(`[RAG Trigger] Request received for: ${filePath}`);

    const { ingestFile } = await import("@/lib/rag/ingestion");

    ingestFile({
      filePath,
      force: true,
      username: user.username || user.email || "admin",
      courseCode,
      level,
    })
      .then((result) => {
        console.log(`[RAG Trigger] Ingestion completed for ${filePath}: ${result.success ? "Success" : "Failed"}`);
      })
      .catch((err) => {
        console.error(`[RAG Trigger] Ingestion failed for ${filePath}:`, err);
      });

    return NextResponse.json({
      success: true,
      message: "Ingestion process started in background",
    });
  } catch (error) {
    console.error("Trigger ingestion error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    }, { status: 500 });
  }
}
