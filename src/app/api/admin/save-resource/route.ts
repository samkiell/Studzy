import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/courses";
import { eq, and, or, sql } from "drizzle-orm";
import { notifyStudentsOfNewContent } from "@/lib/notifications";
import type { ResourceType } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, title, slug, type, fileUrl, description, status, skipNotification } = body as {
      courseId: string;
      title: string;
      slug: string;
      type: ResourceType;
      fileUrl: string;
      description?: string;
      status?: "draft" | "published";
      skipNotification?: boolean;
    };

    if (!courseId || !title || !slug || !type || !fileUrl) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Check if resource already exists in this course
    const [existingDuplicate] = await db
      .select({ id: resources.id, title: resources.title })
      .from(resources)
      .where(
        and(
          eq(resources.course_id, courseId),
          or(
            sql`LOWER(${resources.title}) = LOWER(${title.trim()})`,
            eq(resources.file_url, fileUrl)
          )
        )
      )
      .limit(1);

    if (existingDuplicate) {
      return NextResponse.json({
        success: false,
        message: `A resource titled "${existingDuplicate.title}" is already saved in this course.`,
      }, { status: 409 });
    }

    // Ensure slug is clean
    let cleanSlug = slug.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug) {
      cleanSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "resource";
    }

    let finalSlug = cleanSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      const [existing] = await db
        .select({ id: resources.id })
        .from(resources)
        .where(
          and(
            eq(resources.course_id, courseId),
            eq(resources.slug, finalSlug)
          )
        )
        .limit(1);

      if (!existing) {
        isUnique = true;
      } else {
        finalSlug = `${cleanSlug}-${counter}`;
        counter++;
      }
    }

    // Insert resource into database
    const [resource] = await db
      .insert(resources)
      .values({
        course_id: courseId,
        title: title.trim(),
        slug: finalSlug,
        type,
        file_url: fileUrl,
        description: description?.trim() || null,
        status: status || "published",
        featured: false,
        email_sent: (status || "published") === "published",
        uploader_id: user.id,
      })
      .returning();

    // Notify students of the new resource (only if not handled by a batch upload session)
    if (resource.status === "published" && !skipNotification) {
      after(() =>
        notifyStudentsOfNewContent({
          kind: "resource",
          courseId,
          resourceTitle: title.trim(),
          resourceType: type,
          slug: resource.slug ?? finalSlug,
        })
      );
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

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { id, title, slug, type, description, status, featured } = body;

    if (!id) return NextResponse.json({ success: false, message: "Resource ID required" }, { status: 400 });

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (slug !== undefined) updateData.slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    if (status === "published") {
      const [existingResource] = await db
        .select({
          email_sent: resources.email_sent,
          course_id: resources.course_id,
          title: resources.title,
          type: resources.type,
          slug: resources.slug,
        })
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1);

      if (existingResource && !existingResource.email_sent) {
        updateData.email_sent = true;
        after(() =>
          notifyStudentsOfNewContent({
            kind: "resource",
            courseId: existingResource.course_id,
            resourceTitle: (title !== undefined ? title.trim() : existingResource.title) || "",
            resourceType: (type !== undefined ? type : existingResource.type) || "pdf",
            slug: (slug !== undefined ? slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : existingResource.slug) || "",
          })
        );
      }
    }

    await db.update(resources).set(updateData).where(eq(resources.id, id));

    return NextResponse.json({ success: true, message: "Resource updated successfully" });
  } catch (error: any) {
    console.error("Update resource error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Update failed",
    }, { status: 500 });
  }
}
