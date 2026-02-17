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

    // 1. Delete all embeddings for this file path
    const { error: deleteEmbError } = await supabase
      .from("study_material_embeddings")
      .delete()
      .eq("file_path", filePath);

    if (deleteEmbError) throw deleteEmbError;

    // 2. Delete from storage
    const { error: storageError } = await supabase.storage
      .from("RAG")
      .remove([filePath]);

    if (storageError) {
      console.warn(`[RAG Delete] Failed to delete storage file: ${filePath}`, storageError);
      // We don't throw here because embeddings are already gone, 
      // and the file might not exist in storage (manual cleanup etc)
    }

    // 3. Try to find and delete matching resource record (if any)
    // We construct the public URL to match the file_url pattern
    const { data: { publicUrl } } = supabase.storage.from("RAG").getPublicUrl(filePath);
    
    // Some URLs might have query params etc, so we'll use ilike or match the path segment
    const { error: resourceError } = await supabase
      .from("resources")
      .delete()
      .ilike("file_url", `%${filePath}%`);

    if (resourceError) {
      console.warn(`[RAG Delete] Failed to delete resource record: ${filePath}`, resourceError);
    }

    return NextResponse.json({
      success: true,
      message: "Knowledge and source file deleted successfully",
    });
  } catch (error) {
    console.error("RAG delete error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete RAG embeddings",
    }, { status: 500 });
  }
}
