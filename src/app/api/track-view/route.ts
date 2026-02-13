import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { success: false, message: "Resource ID required" },
        { status: 400 }
      );
    }

    // Increment view_count using RPC or raw update
    const { error } = await supabase.rpc("increment_view_count", {
      resource_id_input: resourceId,
    });

    // If RPC doesn't exist, fallback to manual increment
    if (error) {
      // Fallback: fetch current count and increment
      const { data: resource } = await supabase
        .from("resources")
        .select("view_count")
        .eq("id", resourceId)
        .single();

      if (resource) {
        const { error: updateError } = await supabase
          .from("resources")
          .update({ view_count: (resource.view_count || 0) + 1 })
          .eq("id", resourceId);

        if (updateError) {
          console.error("Error incrementing view_count:", updateError);
          return NextResponse.json(
            { success: false, message: updateError.message },
            { status: 500 }
          );
        }
      }
    }

    // Log activity
    await logActivity("view_resource", resourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("View count error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to track view",
      },
      { status: 500 }
    );
  }
}
