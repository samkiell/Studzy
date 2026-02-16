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

    // Fetch user to check department
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("department")
      .eq("id", userId)
      .single();

    if (!userProfile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (userProfile.department !== "Software Engineering") {
      return NextResponse.json({ 
        success: false, 
        error: "Only Software Engineering students can be verified for ID card generation." 
      }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User verified successfully" });
  } catch (error) {
    console.error("Admin Verify User Error:", error);
    return NextResponse.json({ success: false, error: "Failed to verify user" }, { status: 500 });
  }
}
