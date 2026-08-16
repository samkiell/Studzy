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

    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
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
