import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json({ success: false, message: "Resource ID required" }, { status: 400 });
    }

    // Log activity using centralized function
    const { error } = await logActivity("view_resource", resourceId);

    if (error) {
      console.error("Error tracking activity:", error);
      return NextResponse.json({ success: false, message: "Failed to log activity" }, { status: 500 });
    }

    // Also increment view_count on the resource
    const { data: resource } = await supabase
      .from("resources")
      .select("view_count")
      .eq("id", resourceId)
      .single();

    if (resource) {
      await supabase
        .from("resources")
        .update({ view_count: (resource.view_count || 0) + 1 })
        .eq("id", resourceId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track activity error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to track activity",
    }, { status: 500 });
  }
}
