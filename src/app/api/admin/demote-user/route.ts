import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "admin") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User demoted successfully" });
  } catch (error) {
    console.error("Admin Demote User Error:", error);
    return NextResponse.json({ success: false, error: "Failed to demote user" }, { status: 500 });
  }
}
