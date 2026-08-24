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

    const rangeHeader = request.headers.get("range");
    const response = await getFile(key, rangeHeader || undefined);

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
      gif: "image/gif",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
      ogv: "video/ogg",
      mkv: "video/x-matroska",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      flac: "audio/flac",
      json: "application/json",
      txt: "text/plain",
      csv: "text/csv",
      md: "text/markdown",
    };

    const ext = key.split(".").pop()?.toLowerCase() || "";
    const isGenericMime =
      !response.ContentType ||
      response.ContentType === "binary/octet-stream" ||
      response.ContentType === "application/octet-stream";
    const contentType =
      !isGenericMime && response.ContentType
        ? response.ContentType
        : mimeTypes[ext] || "application/octet-stream";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", "inline");
    headers.set("Accept-Ranges", "bytes");

    if (response.ContentRange) {
      headers.set("Content-Range", response.ContentRange);
    }
    if (response.ContentLength !== undefined) {
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

    const status = rangeHeader && response.ContentRange ? 206 : 200;

    return new NextResponse(stream as any, {
      status,
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
