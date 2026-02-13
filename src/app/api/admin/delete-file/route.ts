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

    // Check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { path } = body as { path: string };

    if (!path) {
      return NextResponse.json({ success: false, message: "No file path provided" }, { status: 400 });
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from("studzy-materials")
      .remove([path]);

    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      return NextResponse.json({
        success: false,
        message: `Delete failed: ${deleteError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Delete failed",
    }, { status: 500 });
  }
}
