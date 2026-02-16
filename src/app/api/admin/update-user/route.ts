import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, UserStatus } from "@/types/database";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { userId, role, status } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 });
    }

    // Prevent admin from modifying their own role or status carelessly if needed
    // But usually admins can manage themselves if there are multiple.
    // For now, let's just apply updates.

    const updateData: any = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Update User Error:", updateError);
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    // If role changed, we might need to update auth.users meta but usually roles are handled in profiles
    
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 });
  }
}
