import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkUploadGuardrail } from "@/lib/supabase/health";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileSize, resourceType } = body;

    if (typeof fileSize !== "number" || !resourceType) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters" }, { status: 400 });
    }

    const guardrail = await checkUploadGuardrail(fileSize, resourceType);

    return NextResponse.json({
      success: true,
      allowed: guardrail.allowed,
      reason: guardrail.reason,
      status: guardrail.status,
      projectedPercentage: guardrail.projectedPercentage,
    });
  } catch (error) {
    console.error("Check guardrail error:", error);
    return NextResponse.json({
      success: false,
      allowed: true, // Graceful fallback
      message: "Check failed",
    }, { status: 500 });
  }
}
