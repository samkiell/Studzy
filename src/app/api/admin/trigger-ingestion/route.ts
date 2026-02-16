import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { filePath, courseCode, level } = body;

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    console.log(`[RAG Trigger] Request received for: ${filePath}`);

    // Trigger ingestion
    // We import dynamically to avoid loading RAG libs on every request if unnecessary
    const { ingestFile } = await import("@/lib/rag/ingestion");

    // We don't await the full ingestion to keep the response fast? 
    // Actually, for a manual trigger, it might be nice to know if it started successfully.
    // But since it can take time, maybe just trigger it.
    // However, the `ingestFile` function is async. If we await it, we risk timeout on Vercel for VERY large files if parsing takes long.
    // BUT, splitting into "upload" and "ingest" helps. 
    // Let's await it. If it times out, the user gets an error, but the process *might* continue? 
    // Safer to fire and forget OR use a background job. 
    // For now, I'll await it but with a catch. Vercel functions have 10s (hobby) or 60s (pro) timeout. 
    // 30MB audio/pdf parsing might take >10s.
    // Strategy: Run ingestion, but if it takes too long, we can't easily "detach" in Next.js generic routes without `waitUntil` (Next.js 15?) or Edge functions.
    // I'll wrap it in a non-awaited promise for now to avoid timeout, 
    // OR just await it and hope for the best. 
    // actually, let's NOT await the full process if we fear timeout.
    // But the user wants to see "Ingested" status.
    // The previous implementation in `upload-file` did: `ingestFile(...).catch(...)` WITHOUT await.
    // So I will follow that pattern: Fire and forget from the HTTP response perspective.

    ingestFile({
      filePath,
      force: true,
      username: profile.username || user.email || "admin",
      courseCode,
      level
    }).then((result) => {
        console.log(`[RAG Trigger] Ingestion completed for ${filePath}: ${result.success ? 'Success' : 'Failed'}`);
    }).catch(err => {
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
