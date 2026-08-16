import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { path } = body as { path: string };

    if (!path) {
      return NextResponse.json({ success: false, message: "No file path provided" }, { status: 400 });
    }

    // Delete from Filebase
    await deleteFile(path);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Delete failed",
    }, { status: 500 });
  }
}
