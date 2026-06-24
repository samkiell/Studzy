import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    if (body.fullName !== undefined) {
      updatePayload.full_name = body.fullName?.trim() || null;
    }
    if (body.username !== undefined) {
      const username = body.username?.trim()?.toLowerCase();
      if (!username || !/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        return NextResponse.json(
          { error: "Username must be 3-15 characters, alphanumeric/underscores only." },
          { status: 400 }
        );
      }
      updatePayload.username = username;
    }
    if (body.bio !== undefined) {
      updatePayload.bio = body.bio;
    }
    if (body.learningGoal !== undefined) {
      updatePayload.learning_goal = body.learningGoal;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Username is already taken." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
