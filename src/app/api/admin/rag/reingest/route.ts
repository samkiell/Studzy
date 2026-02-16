import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ingestFile } from "@/lib/rag/ingestion";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { filePath, username, courseCode, level } = await request.json();

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    // Trigger ingestion (it will handle deleting old embeddings if they exist)
    // We run it as a promise but don't await the full processing to avoid timeout
    // unless it's small, but ingestFile already has its own async logic
    ingestFile({
      filePath,
      username: username || "admin",
      courseCode,
      level,
      force: true, // Force re-processing
    }).catch(err => {
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
