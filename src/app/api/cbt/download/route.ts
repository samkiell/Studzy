import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing courseId parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 1. Verify user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // 2. Fetch questions for the course
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("*")
      .eq("course_id", courseId);

    if (questionsError) {
      console.error("[CBT Download API] Database fetch error:", questionsError);
      return NextResponse.json(
        { error: `Database error: ${questionsError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
    });
  } catch (error: any) {
    console.error("[CBT Download API] Internal server error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
