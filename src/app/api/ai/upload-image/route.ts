import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({
        error: `Image exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
      }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Unsupported image type: ${file.type}`,
      }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const key = `chat-images/${user.id}/${timestamp}-${randomId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Filebase
    const fileUrl = await uploadFile({
      key,
      body: buffer,
      contentType: file.type,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      url: fileUrl,
      path: key,
    });
  } catch (error) {
    console.error("Chat image upload error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Upload failed",
    }, { status: 500 });
  }
}
