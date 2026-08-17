import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { notifyStudentsOfNewContent } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, items } = body as {
      courseId: string;
      items: Array<{
        title: string;
        type: string;
        slug?: string;
      }>;
    };

    if (!courseId || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Missing courseId or items" }, { status: 400 });
    }

    // Send single consolidated email for the entire upload batch
    if (items.length === 1) {
      await notifyStudentsOfNewContent({
        kind: "resource",
        courseId,
        resourceTitle: items[0].title,
        resourceType: items[0].type,
        slug: items[0].slug,
      });
    } else {
      await notifyStudentsOfNewContent({
        kind: "batch_resources",
        courseId,
        items,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Batch notification queued for ${items.length} items`,
    });
  } catch (error: any) {
    console.error("Batch notification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to notify students" },
      { status: 500 }
    );
  }
}
