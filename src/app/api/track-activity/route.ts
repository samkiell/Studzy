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

    // Upsert activity record (insert or update if exists)
    const { error } = await supabase
      .from("user_activity")
      .upsert(
        {
          user_id: user.id,
          resource_id: resourceId,
          last_accessed: new Date().toISOString(),
        },
        {
          onConflict: "user_id,resource_id",
        }
      );

    if (error) {
      console.error("Error tracking activity:", error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
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
