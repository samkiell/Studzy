import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { courses } from "@/lib/db/schema/courses";
import { eq, and, ne, isNotNull } from "drizzle-orm";
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
 * Fetch the email + name of every active student using Drizzle.
 */
async function getStudentRecipients(): Promise<StudentRecipient[]> {
  const data = await db
    .select({
      email: users.email,
      full_name: users.full_name,
      username: users.username,
    })
    .from(users)
    .where(
      and(
        ne(users.role, "admin"),
        eq(users.status, "active"),
        isNotNull(users.email)
      )
    );

  return (data ?? [])
    .map((row) => ({
      email: row.email!,
      name: row.full_name || row.username || null,
    }))
    .filter((r): r is StudentRecipient => !!r.email);
}

/**
 * Email all active students that new content was published for a course.
 */
export async function notifyStudentsOfNewContent(content: NewContent): Promise<void> {
  try {
    const [course] = await db
      .select({
        code: courses.code,
        title: courses.title,
      })
      .from(courses)
      .where(eq(courses.id, content.courseId))
      .limit(1);

    if (!course) {
      console.warn("[notifications] Course not found, skipping:", content.courseId);
      return;
    }

    const testEmail = process.env.NOTIFY_TEST_EMAIL?.trim();
    const recipients: StudentRecipient[] = testEmail
      ? [{ email: testEmail, name: null }]
      : await getStudentRecipients();

    if (testEmail) {
      console.log(`[notifications] TEST MODE — sending only to ${testEmail} (not students).`);
    }

    if (recipients.length === 0) {
      console.log("[notifications] No recipients, skipping email.");
      return;
    }

    const base = siteUrl();
    const courseUrl = `${base}/course/${course.code}`;

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
      `[notifications] ${content.kind} email for ${course.code}: sent ${result.sent}/${result.total}, failed ${result.failed}.`
    );
  } catch (err) {
    console.error("[notifications] Unexpected error notifying students:", err);
  }
}
