import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestFile, ingestMultipleFiles } from "@/lib/rag/ingestion";

/**
 * POST /api/ai/rag/ingest
 *
 * Trigger ingestion for one or more PDF files from Supabase Storage.
 *
 * Body (single file):
 * {
 *   "file_path": "pdf/uuid/filename.pdf",
 *   "course_code": "CSC301",
 *   "level": "300",
 *   "force": false
 * }
 *
 * Body (multiple files):
 * {
 *   "files": [
 *     { "file_path": "pdf/uuid/file1.pdf", "course_code": "CSC301", "level": "300" },
 *     { "file_path": "pdf/uuid/file2.pdf", "course_code": "CSC302", "level": "300" }
 *   ]
 * }
 *
 * Protected: requires admin role.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access via Authorization header or cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      // Try to get user from service role check (internal calls)
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 401 }
        );
      }
    } else {
      // Verify user is admin
      const supabase = createAdminClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication token." },
          { status: 401 }
        );
      }

      // Check admin role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden. Admin role required." },
          { status: 403 }
        );
      }
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
