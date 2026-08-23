import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { resources } from "@/lib/db/schema/courses";
import { eq, and, or, sql } from "drizzle-orm";
import { uploadFile, getPresignedUploadUrl, getPublicUrl } from "@/lib/storage";
import type { ResourceType } from "@/types/database";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const ALLOWED_TYPES: Record<ResourceType, string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/m4a", "audio/x-m4a"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  pdf: ["application/pdf"],
  image: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
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
    "application/octet-stream",
  ],
  question_bank: ["application/json", "application/octet-stream", "text/plain"],
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";

    // -------------------------------------------------------------------------
    // 1. Direct Presigned URL Generation (Bypasses serverless body limits)
    // -------------------------------------------------------------------------
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const fileName = body.fileName as string;
      const fileType = (body.fileType as string) || "application/octet-stream";
      const fileSize = Number(body.fileSize) || 0;
      const type = body.type as ResourceType;
      const courseId = body.courseId as string | null;
      const isRAG = Boolean(body.isRAG);

      if (!fileName) {
        return NextResponse.json({ success: false, message: "No fileName provided" }, { status: 400 });
      }

      if (fileSize > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          message: `File size exceeds 100MB limit. Your file is ${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
        }, { status: 400 });
      }

      // Check for duplicate resource in course
      if (courseId && !isRAG) {
        const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
        const rawName = fileName.replace(/\.[^/.]+$/, "").trim();

        const [existingResource] = await db
          .select({ id: resources.id, title: resources.title })
          .from(resources)
          .where(
            and(
              eq(resources.course_id, courseId),
              or(
                sql`LOWER(${resources.title}) = LOWER(${baseName})`,
                sql`LOWER(${resources.title}) = LOWER(${rawName})`,
                sql`LOWER(${resources.title}) = LOWER(${fileName})`
              )
            )
          )
          .limit(1);

        if (existingResource) {
          return NextResponse.json({
            success: false,
            message: `Resource "${existingResource.title}" already exists for this course. Please remove or rename it to avoid duplicate uploads.`,
          }, { status: 409 });
        }
      }

      // Generate unique key and presigned upload URL
      const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const folder = isRAG ? "rag" : "materials";
      const key = `${folder}/${type}/${timestamp}-${randomId}.${fileExtension}`;

      const uploadUrl = await getPresignedUploadUrl(key, undefined, 3600);
      const publicUrl = getPublicUrl(key);

      return NextResponse.json({
        success: true,
        directUpload: true,
        uploadUrl,
        fileUrl: publicUrl,
        storagePath: key,
      });
    }

    // -------------------------------------------------------------------------
    // 2. Fallback FormData Upload
    // -------------------------------------------------------------------------
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as ResourceType;
    const courseId = formData.get("courseId") as string | null;
    const isRAG = formData.get("isRAG") === "true";

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        message: `File size exceeds 100MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      }, { status: 400 });
    }

    // Validate file type by MIME or extension fallback
    const allowedMimeTypes = ALLOWED_TYPES[type];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const isExtensionAllowed =
      (type === "pdf" && fileExt === "pdf") ||
      (type === "document" && ["txt", "md", "json", "csv", "js", "ts", "py", "tsx", "jsx"].includes(fileExt || "")) ||
      (type === "question_bank" && fileExt === "json") ||
      (type === "audio" && ["mp3", "wav", "ogg", "m4a", "flac"].includes(fileExt || "")) ||
      (type === "video" && ["mp4", "webm", "mov", "avi"].includes(fileExt || "")) ||
      (type === "image" && ["jpg", "jpeg", "png", "webp", "svg", "gif"].includes(fileExt || ""));

    const isMimeAllowed = allowedMimeTypes && (allowedMimeTypes.includes(file.type) || file.type === "application/octet-stream" || file.type === "");

    if (!isMimeAllowed && !isExtensionAllowed) {
      return NextResponse.json({
        success: false,
        message: `Invalid file type for ${type}. Received: ${file.type || "unknown"} (.${fileExt})`,
      }, { status: 400 });
    }

    // Check for duplicate resource in course
    if (courseId && !isRAG) {
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      const rawName = file.name.replace(/\.[^/.]+$/, "").trim();

      const [existingResource] = await db
        .select({ id: resources.id, title: resources.title })
        .from(resources)
        .where(
          and(
            eq(resources.course_id, courseId),
            or(
              sql`LOWER(${resources.title}) = LOWER(${baseName})`,
              sql`LOWER(${resources.title}) = LOWER(${rawName})`,
              sql`LOWER(${resources.title}) = LOWER(${file.name})`
            )
          )
        )
        .limit(1);

      if (existingResource) {
        return NextResponse.json({
          success: false,
          message: `Resource "${existingResource.title}" already exists for this course. Please remove or rename it to avoid duplicate uploads.`,
        }, { status: 409 });
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const folder = isRAG ? "rag" : "materials";
    const key = `${folder}/${type}/${timestamp}-${randomId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Filebase (use application/octet-stream to avoid free-tier video MIME quotas)
    const fileUrl = await uploadFile({
      key,
      body: buffer,
      contentType: "application/octet-stream",
      metadata: {
        uploadedBy: user.id,
        originalName: file.name,
      },
    });

    // If RAG upload, trigger ingestion
    if (isRAG && (type === "pdf" || type === "document")) {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[RAG Upload] Triggering auto-ingestion for: ${key}`);

        ingestFile({
          filePath: key,
          force: true,
          username: user.username || user.email || "admin",
        }).catch((err) => {
          console.error(`[RAG Upload] Ingestion failed for ${key}:`, err);
        });
      } catch (err) {
        console.error(`[RAG Upload] Failed to trigger ingestion:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: isRAG ? "File uploaded and triggered for RAG ingestion" : "File uploaded successfully",
      fileUrl,
      storagePath: key,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Upload failed",
    }, { status: 500 });
  }
}
