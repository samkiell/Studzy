import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { uploadFile } from "@/lib/storage";
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
  ],
  question_bank: ["application/json"],
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
    const folder = isRAG ? "rag" : "materials";
    const key = `${folder}/${type}/${timestamp}-${randomId}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Filebase
    const fileUrl = await uploadFile({
      key,
      body: buffer,
      contentType: file.type,
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
