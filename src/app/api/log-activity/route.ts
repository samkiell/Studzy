import { NextRequest, NextResponse } from "next/server";
import { logActivity, ActivityAction } from "@/lib/activity";

export async function POST(request: NextRequest) {
  try {
    const { actionType, resourceId, metadata } = await request.json();

    if (!actionType) {
      return NextResponse.json({ success: false, message: "Action type required" }, { status: 400 });
    }

    await logActivity(actionType as ActivityAction, resourceId, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Client log activity error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
