import nodemailer from 'nodemailer';

function buildSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const SMTP_SENDER_NAME = process.env.SMTP_SENDER_NAME || 'Studzy';
const SMTP_SENDER_EMAIL = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER || '';
const SMTP_FROM = `"${SMTP_SENDER_NAME}" <${SMTP_SENDER_EMAIL}>`;

const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || `Studzy <noreply@studzy.me>`;

export type EmailOptions = {
  to: string;
  subject: string;
  html: string;
};

async function sendWithResend(to: string, subject: string, html: string) {
  const { Resend } = await import('resend');
  const client = new Resend(RESEND_API_KEY);
  const result = await client.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });
  return result;
}

async function sendWithSmtp(to: string, subject: string, html: string) {
  const transporter = buildSmtpTransporter();
  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
  });
  return info;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (RESEND_API_KEY) {
      const result = await sendWithResend(to, subject, html);
      return { success: true, messageId: (result as any)?.data?.id };
    }
  } catch (error) {
    console.error('Resend email sending failed, falling back to SMTP:', error);
  }
  try {
    const info = await sendWithSmtp(to, subject, html);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

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
      if (RESEND_API_KEY) {
        const batchTo = RESEND_FROM_EMAIL.includes('<') && RESEND_FROM_EMAIL.includes('>')
          ? RESEND_FROM_EMAIL
          : `Studzy <${RESEND_FROM_EMAIL}>`;
        await sendWithResend(batchTo, subject, html);
      } else {
        await sendWithSmtp(SMTP_SENDER_EMAIL, subject, html);
      }
      sent += chunk.length;
    } catch (error) {
      console.error(`Bulk email chunk failed (${chunk.length} recipients):`, error);
      failed += chunk.length;
    }
    if (i + chunkSize < unique.length) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return { sent, failed, total: unique.length };
}

export type IndividualEmail = {
  to: string;
  subject: string;
  html: string;
};

export async function sendIndividualEmails(messages: IndividualEmail[], delayMs = 150) {
  const seen = new Set<string>();
  const queue = messages.filter((m) => {
    const addr = m.to?.trim().toLowerCase();
    if (!addr || seen.has(addr)) return false;
    seen.add(addr);
    return true;
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i++) {
    const msg = queue[i];
    try {
      if (RESEND_API_KEY) {
        await sendWithResend(msg.to, msg.subject, msg.html);
      } else {
        await sendWithSmtp(msg.to, msg.subject, msg.html);
      }
      sent++;
    } catch (error) {
      console.error(`Individual email to ${msg.to} failed:`, error);
      failed++;
    }
    if (delayMs > 0 && i < queue.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return { sent, failed, total: queue.length };
}

export function queueEmail(options: EmailOptions) {
  sendEmail(options).catch((err) => {
    console.error('Queued email failed:', err);
  });
}
