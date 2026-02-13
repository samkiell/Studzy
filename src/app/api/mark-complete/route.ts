import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Upsert progress record
    const { error } = await supabase
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          resource_id: resourceId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,resource_id" }
      );

    if (error) {
      console.error("Error marking resource complete:", error);
      return NextResponse.json(
        { error: "Failed to mark resource complete" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-complete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");
    const courseId = searchParams.get("courseId");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get progress for a single resource
    if (resourceId) {
      const { data } = await supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .single();

      return NextResponse.json({ completed: data?.completed || false });
    }

    // Get progress for all resources in a course
    if (courseId) {
      const { data: resources } = await supabase
        .from("resources")
        .select("id")
        .eq("course_id", courseId);

      if (!resources || resources.length === 0) {
        return NextResponse.json({ completed: [], total: 0 });
      }

      const resourceIds = resources.map((r) => r.id);

      const { data: progress } = await supabase
        .from("user_progress")
        .select("resource_id")
        .eq("user_id", user.id)
        .in("resource_id", resourceIds)
        .eq("completed", true);

      return NextResponse.json({
        completed: progress?.map((p) => p.resource_id) || [],
        total: resources.length,
      });
    }

    return NextResponse.json(
      { error: "resourceId or courseId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in mark-complete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
