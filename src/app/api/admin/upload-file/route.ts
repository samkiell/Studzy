import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ResourceType } from "@/types/database";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<ResourceType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
};

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as ResourceType;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        message: `File size exceeds 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = ALLOWED_TYPES[type];
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: `Invalid file type for ${type}. Received: ${file.type}`,
      }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const isRAG = formData.get("isRAG") === "true";
    const bucketName = "RAG";
    const fileName = `${type}/${timestamp}-${randomId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({
        success: false,
        message: `Upload failed: ${uploadError.message}`,
      }, { status: 500 });
    }

    // 🎓 If this is a RAG upload, trigger ingestion automatically
    if (isRAG && type === "pdf") {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[RAG Upload] Triggering auto-ingestion for: ${uploadData.path}`);
        
        // This runs asynchronously in the background
        ingestFile({
          filePath: uploadData.path,
          force: true,
          username: profile?.username || user.email || "admin", // Tag with username
        }).catch(err => {
          console.error(`[RAG Upload] Ingestion failed for ${uploadData.path}:`, err);
        });
      } catch (err) {
        console.error(`[RAG Upload] Failed to trigger ingestion:`, err);
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      message: isRAG ? "File uploaded and triggered for RAG ingestion" : "File uploaded successfully",
      fileUrl: urlData.publicUrl,
      storagePath: uploadData.path,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Upload failed",
    }, { status: 500 });
  }
}
