import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyStudentsOfNewContent } from "@/lib/notifications";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { resourceId, field, value } = body as {
      resourceId: string;
      field: "featured" | "status";
      value: boolean | string;
    };

    if (!resourceId || !field) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate field and value
    if (field === "featured" && typeof value !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Featured must be a boolean" },
        { status: 400 }
      );
    }

    if (
      field === "status" &&
      !["draft", "published"].includes(value as string)
    ) {
      return NextResponse.json(
        { success: false, message: "Status must be 'draft' or 'published'" },
        { status: 400 }
      );
    }

    let updatePayload: any = { [field]: value };
    let shouldNotify = false;
    let resourceDetails: any = null;

    if (field === "status" && value === "published") {
      const { data: existingResource } = await supabase
        .from("resources")
        .select("email_sent, course_id, title, type, slug")
        .eq("id", resourceId)
        .single();

      if (existingResource && !existingResource.email_sent) {
        updatePayload.email_sent = true;
        shouldNotify = true;
        resourceDetails = existingResource;
      }
    }

    const { error: updateError } = await supabase
      .from("resources")
      .update(updatePayload)
      .eq("id", resourceId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { success: false, message: `Failed to update: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (shouldNotify && resourceDetails) {
      after(() =>
        notifyStudentsOfNewContent({
          kind: "resource",
          courseId: resourceDetails.course_id,
          resourceTitle: resourceDetails.title,
          resourceType: resourceDetails.type,
          slug: resourceDetails.slug,
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Resource ${field} updated successfully`,
    });
  } catch (error) {
    console.error("Toggle resource error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update resource",
      },
      { status: 500 }
    );
  }
}
