import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ingestFile, ingestMultipleFiles } from "@/lib/rag/ingestion";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Handle multiple files
    if (body.files && Array.isArray(body.files)) {
      const results = await ingestMultipleFiles(
        body.files.map((f: any) => ({
          filePath: f.file_path,
          courseCode: f.course_code,
          level: f.level,
          force: f.force || body.force || false,
          username: user.username || "admin",
        }))
      );

      const summary = {
        total: results.length,
        successful: results.filter((r) => r.success && !r.skipped).length,
        skipped: results.filter((r) => r.skipped).length,
        failed: results.filter((r) => !r.success).length,
        totalChunks: results.reduce((sum, r) => sum + r.chunksStored, 0),
      };

      return NextResponse.json({ summary, results });
    }

    // Handle single file
    const { file_path, course_code, level, force } = body;

    if (!file_path) {
      return NextResponse.json(
        { error: "file_path is required" },
        { status: 400 }
      );
    }

    const result = await ingestFile({
      filePath: file_path,
      courseCode: course_code,
      level,
      force: force || false,
      username: user.username || "admin",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, result },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("[RAG Ingest API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
