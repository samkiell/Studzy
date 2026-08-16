import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { uploadFile } from "@/lib/storage";
import { notifyStudentsOfNewContent } from "@/lib/notifications";
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
  question_bank: ["application/json"],
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

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
    const key = `materials/${type}/${courseId}/${timestamp}-${sanitizedTitle}.${fileExtension}`;

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
        courseId,
        originalName: file.name,
      },
    });

    const slug = sanitizedTitle.slice(0, 50);

    // Insert resource into database
    const [resource] = await db
      .insert(resources)
      .values({
        course_id: courseId,
        title: title.trim(),
        slug,
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
        status: "published",
        uploader_id: user.id,
        email_sent: true,
      })
      .returning();

    // RAG auto-ingestion for searchable types
    if (type === "pdf" || type === "document") {
      try {
        const { ingestFile } = await import("@/lib/rag/ingestion");
        console.log(`[API Upload] Triggering auto-ingestion for: ${key}`);
        
        ingestFile({
          filePath: key,
          courseCode: courseId,
          force: true,
          username: user.username || user.email || "admin",
        }).catch((err) => {
          console.error(`[API Upload] Ingestion failed for ${key}:`, err);
        });
      } catch (err) {
        console.error(`[API Upload] Failed to trigger ingestion:`, err);
      }
    }

    if (resource.status === "published") {
      after(() =>
        notifyStudentsOfNewContent({
          kind: "resource",
          courseId,
          resourceTitle: title.trim(),
          resourceType: type,
          slug: resource.slug ?? slug,
        })
      );
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
