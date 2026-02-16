import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    // Check if bookmark exists
    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", resourceId)
      .maybeSingle();

    if (existing) {
      // Remove it
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return NextResponse.json({ bookmarked: false });
    } else {
      // Add it
      const { error } = await supabase
        .from("bookmarks")
        .insert({
          user_id: user.id,
          resource_id: resourceId
        });
      if (error) throw error;
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ bookmarked: false });

    const { data } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("resource_id", resourceId)
      .maybeSingle();

    return NextResponse.json({ bookmarked: !!data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
