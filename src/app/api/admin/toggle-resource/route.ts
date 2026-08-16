import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { eq } from "drizzle-orm";
import { notifyStudentsOfNewContent } from "@/lib/notifications";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
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

    let updatePayload: Record<string, any> = { [field]: value };
    let shouldNotify = false;
    let resourceDetails: any = null;

    if (field === "status" && value === "published") {
      const [existingResource] = await db
        .select({
          email_sent: resources.email_sent,
          course_id: resources.course_id,
          title: resources.title,
          type: resources.type,
          slug: resources.slug,
        })
        .from(resources)
        .where(eq(resources.id, resourceId))
        .limit(1);

      if (existingResource && !existingResource.email_sent) {
        updatePayload.email_sent = true;
        shouldNotify = true;
        resourceDetails = existingResource;
      }
    }

    await db
      .update(resources)
      .set(updatePayload)
      .where(eq(resources.id, resourceId));

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
