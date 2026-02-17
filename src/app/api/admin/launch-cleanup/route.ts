import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performLaunchCleanup } from "@/lib/db-launch-cleanup";

/**
 * POST /api/admin/launch-cleanup
 * 
 * Secure endpoint to trigger the production launch database cleanup.
 * REQUIRES: Admin user authentication.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // 1. Verify User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify Admin Role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "ADMIN") {
      console.warn(`[ADMIN] Unauthorized cleanup attempt by user ${user.id} (${user.email})`);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 3. Perform Cleanup
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
      message: "Database cleared successfully for launch. Keep studying (safely)!" 
    });
  } catch (error: any) {
    console.error("[ADMIN] Cleanup route error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
