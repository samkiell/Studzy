import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ResourceType } from "@/types/database";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<ResourceType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: [
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "text/javascript",
    "application/javascript",
    "application/typescript",
    "text/x-typescript",
    "text/x-python",
    "application/x-python-code",
  ],
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const courseId = formData.get("courseId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as ResourceType;
    const description = formData.get("description") as string | null;
    const file = formData.get("file") as File | null;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { success: false, message: "Please select a course" },
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a title" },
        { status: 400 }
      );
    }

    if (!type || !["audio", "video", "pdf", "image", "document"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid resource type" },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "Please select a file to upload" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = ALLOWED_TYPES[type];
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid file type for ${type}. Received: ${file.type}`,
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${type}/${courseId}/${timestamp}-${sanitizedTitle}.${fileExtension}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("RAG")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, message: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("RAG")
      .getPublicUrl(uploadData.path);

    const fileUrl = urlData.publicUrl;

    // Insert resource into database
    const { data: resource, error: insertError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        title: title.trim(),
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("RAG").remove([uploadData.path]);
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { success: false, message: `Failed to save resource: ${insertError.message}` },
        { status: 500 }
      );
    }

    // 🎓 RAG: Trigger ingestion automatically for searchable types
    if (type === "pdf" || type === "document") {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[API Upload] Triggering auto-ingestion for: ${uploadData.path}`);
        
        ingestFile({
          filePath: uploadData.path,
          courseCode: courseId,
          force: true,
          username: profile.username || user.email || "admin",
        }).catch(err => {
          console.error(`[API Upload] Ingestion failed for ${uploadData.path}:`, err);
        });
      } catch (err) {
        console.error(`[API Upload] Failed to trigger ingestion:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `"${title}" uploaded successfully!`,
      resourceId: resource.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
