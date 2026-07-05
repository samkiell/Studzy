import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  try {
    const testEmail = process.env.NOTIFY_TEST_EMAIL;
    if (!testEmail) {
      return NextResponse.json({ error: "NOTIFY_TEST_EMAIL is not set" }, { status: 400 });
    }
    
    await sendEmail({
      to: testEmail,
      subject: "API Route Test Email from Studzy",
      html: "<p>This is a test email sent from the Next.js API route to verify functionality.</p>"
    });
    
    return NextResponse.json({ success: true, message: `Email sent to ${testEmail}` });
  } catch (error: any) {
    console.error("Test email API route error:", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}
