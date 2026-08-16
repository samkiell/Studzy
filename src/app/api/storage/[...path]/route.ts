import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path ? path.map((segment) => decodeURIComponent(segment)).join("/") : "";

    if (!key) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const response = await getFile(key);

    if (!response.Body) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Convert S3 body to web ReadableStream
    const stream = response.Body.transformToWebStream();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4",
      json: "application/json",
      txt: "text/plain",
    };

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const contentType = response.ContentType && response.ContentType !== "binary/octet-stream"
      ? response.ContentType
      : mimeTypes[ext] || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", "inline");

    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    if (response.ETag) {
      headers.set("ETag", response.ETag);
    }

    // High performance cache for avatars and uploaded materials
    headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    );

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return new NextResponse("File Not Found", { status: 404 });
    }
    console.error("Storage streaming error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
