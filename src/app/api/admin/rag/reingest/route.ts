import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ingestFile } from "@/lib/rag/ingestion";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { filePath, username, courseCode, level } = await request.json();

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    ingestFile({
      filePath,
      username: username || user.username || "admin",
      courseCode,
      level,
      force: true,
    }).catch((err) => {
      console.error(`[RAG Re-ingest] Failed for ${filePath}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "Re-ingestion triggered for background processing",
    });
  } catch (error) {
    console.error("RAG re-ingest error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to trigger re-ingestion",
    }, { status: 500 });
  }
}
