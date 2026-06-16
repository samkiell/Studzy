export const getEmailTemplate = (type: 'confirm' | 'reset' | 'change' | 'magic', data: { link: string; name?: string }) => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { font-size: 12px; color: #6b7280; margin-top: 40px; }
  `;

  const templates = {
    confirm: {
      subject: 'Confirm your Studzy account',
      html: `
        <div class="container">
          <h2>Welcome to Studzy!</h2>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thanks for signing up. Please click the button below to confirm your account and start learning.</p>
          <a href="${data.link}" class="button">Confirm Account</a>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Studzy. Built with love for students.
          </div>
        </div>
        <style>${baseStyles}</style>
      `
    },
    reset: {
      subject: 'Reset your password - Studzy',
      html: `
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to choose a new one.</p>
          <a href="${data.link}" class="button">Reset Password</a>
          <p>This link will expire in 1 hour. If you didn't request this, your password will remain unchanged.</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Studzy.
          </div>
        </div>
        <style>${baseStyles}</style>
      `
    },
    change: {
      subject: 'Confirm your new email address',
      html: `
        <div class="container">
          <h2>Change Email Address</h2>
          <p>Please click the button below to confirm your new email address.</p>
          <a href="${data.link}" class="button">Confirm New Email</a>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Studzy.
          </div>
        </div>
        <style>${baseStyles}</style>
      `
    },
    magic: {
      subject: 'Your magic link for Studzy',
      html: `
        <div class="container">
          <h2>Sign in to Studzy</h2>
          <p>Click the button below to sign in instantly. No password required.</p>
          <a href="${data.link}" class="button">Sign In</a>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Studzy.
          </div>
        </div>
        <style>${baseStyles}</style>
      `
    }
  };

  return templates[type];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  audio: 'audio lecture',
  video: 'video',
  pdf: 'PDF',
  image: 'image',
  document: 'document',
  question_bank: 'question bank',
};

/**
 * Email sent to students when an admin uploads a new resource or CBT questions.
 */
export const getNewContentEmail = (data: {
  kind: 'resource' | 'questions';
  courseCode: string;
  courseTitle: string;
  url: string;
  recipientName?: string | null; // student's first name, for a personal greeting
  itemTitle?: string; // resource title
  resourceType?: string; // audio | video | pdf | image | document
  count?: number; // number of new questions
}) => {
  const baseStyles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .badge { display: inline-block; padding: 4px 10px; background-color: #ede9fe; color: #6d28d9; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
    .button { display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { font-size: 12px; color: #6b7280; margin-top: 40px; }
  `;

  const course = `${escapeHtml(data.courseCode)} – ${escapeHtml(data.courseTitle)}`;

  // Use only the first word of the name so we greet "Samuel", not "Samuel Ezekiel".
  const firstName = data.recipientName?.trim().split(/\s+/)[0];
  const greeting = `<p>Hi ${firstName ? escapeHtml(firstName) : 'there'},</p>`;

  let subject: string;
  let heading: string;
  let body: string;
  let cta: string;

  if (data.kind === 'resource') {
    const typeLabel = RESOURCE_TYPE_LABEL[data.resourceType ?? ''] ?? 'resource';
    subject = `New ${typeLabel} in ${data.courseCode}`;
    heading = `New ${typeLabel} added`;
    body = `<p><strong>${escapeHtml(data.itemTitle ?? 'A new resource')}</strong> is now available in <strong>${course}</strong>.</p>`;
    cta = 'View Resource';
  } else {
    const n = data.count ?? 0;
    subject = `${n} new practice question${n === 1 ? '' : 's'} in ${data.courseCode}`;
    heading = `${n} new practice question${n === 1 ? '' : 's'} added`;
    body = `<p>${n} new question${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} ready for you to practice in <strong>${course}</strong>.</p>`;
    cta = 'Start Practicing';
  }

  return {
    subject,
    html: `
      <div class="container">
        <span class="badge">Studzy</span>
        <h2 style="margin-top: 16px;">${heading}</h2>
        ${greeting}
        ${body}
        <a href="${data.url}" class="button">${cta}</a>
        <p style="font-size: 13px; color: #6b7280;">Keep up the momentum — your next study session is one click away.</p>
        <div class="footer">
          You're receiving this because you have a Studzy account.<br/>
          &copy; ${new Date().getFullYear()} Studzy.
        </div>
      </div>
      <style>${baseStyles}</style>
    `,
  };
};
