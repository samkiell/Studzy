import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Many SMTP providers require the From address to match the authenticated user,
// and SMTP_SENDER_EMAIL is not always set — fall back to SMTP_USER.
const SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER || '';
const SENDER_FROM = `"${process.env.SMTP_SENDER_NAME || 'Studzy'}" <${SENDER_EMAIL}>`;

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email using the configured SMTP server.
 * Uses a fire-and-forget pattern for non-critical notifications
 * by wrapping in an async block without awaiting if needed.
 */
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: SENDER_FROM,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

/**
 * Sends one email to many recipients via BCC, in chunks so recipients never
 * see each other and large lists don't trip per-message recipient limits.
 * Resolves with delivery counts; never throws (safe for fire-and-forget).
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  chunkSize = 45,
) {
  const unique = Array.from(new Set(recipients.map((e) => e?.trim()).filter(Boolean)));
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    try {
      await transporter.sendMail({
        from: SENDER_FROM,
        to: SENDER_EMAIL, // visible recipient is the sender; real recipients are BCC'd
        bcc: chunk,
        subject,
        html,
      });
      sent += chunk.length;
    } catch (error) {
      console.error(`Bulk email chunk failed (${chunk.length} recipients):`, error);
      failed += chunk.length;
    }
    // brief pause between chunks to be gentle on the SMTP server
    if (i + chunkSize < unique.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return { sent, failed, total: unique.length };
}

/**
 * Queue pattern for non-blocking email sends.
 * In a real production environment, use BullMQ, Inngest, or Upstash QStash.
 */
export function queueEmail(options: EmailOptions) {
  // Fire and forget - doesn't block the request lifecycle
  sendEmail(options).catch((err) => {
    console.error('Queued email failed:', err);
  });
}
