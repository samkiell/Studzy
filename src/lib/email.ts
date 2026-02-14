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
      from: `"${process.env.SMTP_SENDER_NAME}" <${process.env.SMTP_SENDER_EMAIL}>`,
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
 * Queue pattern for non-blocking email sends.
 * In a real production environment, use BullMQ, Inngest, or Upstash QStash.
 */
export function queueEmail(options: EmailOptions) {
  // Fire and forget - doesn't block the request lifecycle
  sendEmail(options).catch((err) => {
    console.error('Queued email failed:', err);
  });
}
