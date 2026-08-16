import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAllStorageObjectsWithResourceLinks } from "@/lib/supabase/health";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const files = await listAllStorageObjectsWithResourceLinks();

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error("Storage list API error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to list storage objects",
    }, { status: 500 });
  }
}
