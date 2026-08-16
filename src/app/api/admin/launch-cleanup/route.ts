import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { performLaunchCleanup } from "@/lib/db-launch-cleanup";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    console.log(`[ADMIN] Launch cleanup initiated by admin: ${user.email}`);
    const results = await performLaunchCleanup();

    if (!results.success) {
      return NextResponse.json({ 
        success: false, 
        error: results.error || "Cleanup failed partially. Check server logs." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database cleared successfully for launch." 
    });
  } catch (error: any) {
    console.error("[ADMIN] Cleanup route error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
