import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ success: false, message: "File path is required" }, { status: 400 });
    }

    // Delete all embeddings for this file path
    const { error: deleteError } = await supabase
      .from("study_material_embeddings")
      .delete()
      .eq("file_path", filePath);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: "RAG embeddings deleted successfully",
    });
  } catch (error) {
    console.error("RAG delete error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete RAG embeddings",
    }, { status: 500 });
  }
}
