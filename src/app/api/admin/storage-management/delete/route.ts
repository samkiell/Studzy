import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteStorageObjectsServer, invalidateHealthCache, getStorageHealthMetrics } from "@/lib/supabase/health";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { bucket, paths } = body as { bucket: string; paths: string[] };

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    const result = await deleteStorageObjectsServer(bucket || "studzy", paths);

    if (result.success) {
      invalidateHealthCache();
      const updatedMetrics = await getStorageHealthMetrics(true);

      return NextResponse.json({
        success: true,
        message: result.message,
        deletedCount: result.deletedCount,
        metrics: updatedMetrics,
      });
    }

    return NextResponse.json({
      success: false,
      message: result.message,
    }, { status: 500 });
  } catch (error) {
    console.error("Storage delete API error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete storage objects",
    }, { status: 500 });
  }
}
