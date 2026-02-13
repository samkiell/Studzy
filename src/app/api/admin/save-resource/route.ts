import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ResourceType } from "@/types/database";

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
    const { courseId, title, type, fileUrl, description } = body as {
      courseId: string;
      title: string;
      type: ResourceType;
      fileUrl: string;
      description?: string;
    };

    if (!courseId || !title || !type || !fileUrl) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Insert resource into database
    const { data: resource, error: insertError } = await supabase
      .from("resources")
      .insert({
        course_id: courseId,
        title: title.trim(),
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json({
        success: false,
        message: `Failed to save: ${insertError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Resource saved successfully",
      resourceId: resource.id,
    });
  } catch (error) {
    console.error("Save resource error:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Save failed",
    }, { status: 500 });
  }
}
