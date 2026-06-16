import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmail } from "@/lib/email";
import { getNewContentEmail } from "@/lib/email-templates";

type NewResource = {
  kind: "resource";
  courseId: string;
  resourceTitle: string;
  resourceType: string;
  slug?: string | null;
};

type NewQuestions = {
  kind: "questions";
  courseId: string;
  courseCode?: string;
  count: number;
};

type NewContent = NewResource | NewQuestions;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://studzy.me"
  ).replace(/\/$/, "");
}

/**
 * Fetch the email addresses of every active student.
 * Uses the service-role client so RLS doesn't hide other users' rows.
 */
async function getStudentEmails(
  admin: ReturnType<typeof createAdminClient>,
): Promise<string[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "student")
    .eq("status", "active")
    .not("email", "is", null);

  if (error) {
    console.error("[notifications] Failed to load student emails:", error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => (row as { email: string | null }).email)
    .filter((e): e is string => !!e);
}

/**
 * Email all active students that new content was published for a course.
 * Safe for fire-and-forget / `after()`: it never throws and logs its own errors.
 */
export async function notifyStudentsOfNewContent(content: NewContent): Promise<void> {
  try {
    const admin = createAdminClient();

    const { data: course } = await admin
      .from("courses")
      .select("code, title")
      .eq("id", content.courseId)
      .maybeSingle();

    if (!course) {
      console.warn("[notifications] Course not found, skipping:", content.courseId);
      return;
    }

    // Fail-safe recipient selection:
    //   1. NOTIFY_TEST_EMAIL set        -> send ONLY to that address (preview/test)
    //   2. NOTIFY_BROADCAST_ALL=true    -> send to ALL active students
    //   3. neither set                  -> send NOTHING (so a fresh deploy can never
    //                                      accidentally email everyone)
    const testEmail = process.env.NOTIFY_TEST_EMAIL?.trim();
    const broadcastAll = process.env.NOTIFY_BROADCAST_ALL === "true";

    let recipients: string[];
    if (testEmail) {
      recipients = [testEmail];
      console.log(`[notifications] TEST MODE — sending only to ${testEmail} (not students).`);
    } else if (broadcastAll) {
      recipients = await getStudentEmails(admin);
    } else {
      console.log(
        "[notifications] Not configured to send. Set NOTIFY_TEST_EMAIL to preview, " +
          "or NOTIFY_BROADCAST_ALL=true to email all students.",
      );
      return;
    }

    if (recipients.length === 0) {
      console.log("[notifications] No recipients, skipping email.");
      return;
    }

    const base = siteUrl();
    const courseUrl = `${base}/course/${course.code}`;

    const email =
      content.kind === "resource"
        ? getNewContentEmail({
            kind: "resource",
            courseCode: course.code,
            courseTitle: course.title,
            itemTitle: content.resourceTitle,
            resourceType: content.resourceType,
            url: content.slug ? `${courseUrl}/resource/${content.slug}` : courseUrl,
          })
        : getNewContentEmail({
            kind: "questions",
            courseCode: course.code,
            courseTitle: course.title,
            count: content.count,
            url: `${base}/cbt`,
          });

    const result = await sendBulkEmail(recipients, email.subject, email.html);
    console.log(
      `[notifications] ${content.kind} email for ${course.code}: sent ${result.sent}/${result.total}, failed ${result.failed}.`,
    );
  } catch (err) {
    console.error("[notifications] Unexpected error notifying students:", err);
  }
}
