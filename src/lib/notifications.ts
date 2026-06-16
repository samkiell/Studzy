import { createAdminClient } from "@/lib/supabase/admin";
import { sendIndividualEmails } from "@/lib/email";
import { getNewContentEmail } from "@/lib/email-templates";

type StudentRecipient = {
  email: string;
  name: string | null;
};

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
 * Fetch the email + name of every active student.
 * Uses the service-role client so RLS doesn't hide other users' rows.
 */
async function getStudentRecipients(
  admin: ReturnType<typeof createAdminClient>,
): Promise<StudentRecipient[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("email, full_name, username")
    .eq("role", "student")
    .eq("status", "active")
    .not("email", "is", null);

  if (error) {
    console.error("[notifications] Failed to load student recipients:", error.message);
    return [];
  }
  return (data ?? [])
    .map((row) => {
      const r = row as { email: string | null; full_name: string | null; username: string | null };
      return { email: r.email, name: r.full_name || r.username || null };
    })
    .filter((r): r is StudentRecipient => !!r.email);
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

    // Recipient selection:
    //   - NOTIFY_TEST_EMAIL set -> send ONLY to that address (for previewing/staging)
    //   - otherwise             -> send to ALL active students (production default)
    const testEmail = process.env.NOTIFY_TEST_EMAIL?.trim();
    const recipients: StudentRecipient[] = testEmail
      ? [{ email: testEmail, name: null }]
      : await getStudentRecipients(admin);

    if (testEmail) {
      console.log(`[notifications] TEST MODE — sending only to ${testEmail} (not students).`);
    }

    if (recipients.length === 0) {
      console.log("[notifications] No recipients, skipping email.");
      return;
    }

    const base = siteUrl();
    const courseUrl = `${base}/course/${course.code}`;

    // Build a personalized message per student (their own "To:" + their name).
    const messages = recipients.map((recipient) => {
      const email =
        content.kind === "resource"
          ? getNewContentEmail({
              kind: "resource",
              courseCode: course.code,
              courseTitle: course.title,
              recipientName: recipient.name,
              itemTitle: content.resourceTitle,
              resourceType: content.resourceType,
              url: content.slug ? `${courseUrl}/resource/${content.slug}` : courseUrl,
            })
          : getNewContentEmail({
              kind: "questions",
              courseCode: course.code,
              courseTitle: course.title,
              recipientName: recipient.name,
              count: content.count,
              url: `${base}/cbt`,
            });
      return { to: recipient.email, subject: email.subject, html: email.html };
    });

    const result = await sendIndividualEmails(messages);
    console.log(
      `[notifications] ${content.kind} email for ${course.code}: sent ${result.sent}/${result.total}, failed ${result.failed}.`,
    );
  } catch (err) {
    console.error("[notifications] Unexpected error notifying students:", err);
  }
}
