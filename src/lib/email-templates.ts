function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const RESOURCE_TYPE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  video: { label: 'Video', bg: '#fee2e2', color: '#dc2626' },
  audio: { label: 'Audio', bg: '#f3e8ff', color: '#9333ea' },
  pdf: { label: 'PDF', bg: '#fef3c7', color: '#d97706' },
  image: { label: 'Image', bg: '#dcfce7', color: '#16a34a' },
  document: { label: 'Doc', bg: '#e0f2fe', color: '#0284c7' },
  question_bank: { label: 'CBT Bank', bg: '#ede9fe', color: '#7c3aed' },
};

function renderEmailLayout({
  badgeText,
  badgeBg = '#7c3aed',
  badgeColor = '#ffffff',
  heading,
  greetingName,
  contentHtml,
  ctaText,
  ctaUrl,
  subtext,
}: {
  badgeText: string;
  badgeBg?: string;
  badgeColor?: string;
  heading: string;
  greetingName?: string | null;
  contentHtml: string;
  ctaText: string;
  ctaUrl: string;
  subtext?: string;
}) {
  const currentYear = new Date().getFullYear();
  const name = greetingName ? escapeHtml(greetingName.trim().split(/\s+/)[0]) : 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0d12; width: 100%; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper (max 580px) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #161822; border: 1px solid #232738; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);">
          
          <!-- Top Branded Header -->
          <tr>
            <td style="padding: 32px 36px 24px 36px; background: linear-gradient(135deg, #1c1f2e 0%, #161822 100%); border-bottom: 1px solid #232738;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Studzy Logo & Badge -->
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); border-radius: 10px; width: 32px; height: 32px; text-align: center; vertical-align: middle;">
                          <span style="color: #ffffff; font-size: 16px; font-weight: 900; line-height: 32px; display: block;">⚡</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <span style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">Studzy</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${badgeBg}; color: ${badgeColor}; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${escapeHtml(badgeText)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 36px 36px 28px 36px; background-color: #161822;">
              <h1 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 22px; font-weight: 700; line-height: 1.35; letter-spacing: -0.01em;">
                ${escapeHtml(heading)}
              </h1>

              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Hi <strong style="color: #f1f5f9;">${name}</strong>,
              </p>

              <div style="color: #cbd5e1; font-size: 15px; line-height: 1.65;">
                ${contentHtml}
              </div>

              <!-- CTA Button Section -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <table border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
                          <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: inherit; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px; letter-spacing: 0.01em;">
                            ${escapeHtml(ctaText)} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${subtext ? `
                <p style="margin: 20px 0 0 0; padding-top: 20px; border-top: 1px solid #232738; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
                  ${subtext}
                </p>
              ` : ''}
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="padding: 24px 36px; background-color: #11131a; border-top: 1px solid #1e212e; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #475569; font-size: 12px; line-height: 1.5;">
                Dedicated learning and revision platform for Software Engineering pioneers.
              </p>
              <p style="margin: 0; color: #334155; font-size: 11px;">
                &copy; ${currentYear} Studzy · <a href="https://studzy.me" style="color: #6366f1; text-decoration: none;">studzy.me</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export const getEmailTemplate = (type: 'confirm' | 'reset' | 'change' | 'magic', data: { link: string; name?: string }) => {
  switch (type) {
    case 'confirm':
      return {
        subject: 'Confirm your Studzy account',
        html: renderEmailLayout({
          badgeText: 'Account Verification',
          heading: 'Welcome to Studzy!',
          greetingName: data.name,
          contentHtml: '<p style="margin: 0;">Thanks for joining us! Please confirm your email address to unlock your personal dashboard, course notes, past questions, and AI tutor.</p>',
          ctaText: 'Confirm Account',
          ctaUrl: data.link,
          subtext: "If you didn't create an account with Studzy, you can safely ignore this email.",
        }),
      };

    case 'reset':
      return {
        subject: 'Reset your password – Studzy',
        html: renderEmailLayout({
          badgeText: 'Security Notice',
          badgeBg: '#ea580c',
          heading: 'Password Reset Request',
          greetingName: data.name,
          contentHtml: '<p style="margin: 0;">We received a request to reset your Studzy password. Click the button below to choose a secure new password for your account.</p>',
          ctaText: 'Reset Password',
          ctaUrl: data.link,
          subtext: 'This link expires in 1 hour. If you did not make this request, your account remains completely safe.',
        }),
      };

    case 'change':
      return {
        subject: 'Confirm your new email address',
        html: renderEmailLayout({
          badgeText: 'Email Update',
          heading: 'Confirm New Email Address',
          greetingName: data.name,
          contentHtml: '<p style="margin: 0;">Please click the button below to verify and activate your new email address for your Studzy account.</p>',
          ctaText: 'Confirm New Email',
          ctaUrl: data.link,
          subtext: 'If you did not request to change your email, please secure your account immediately.',
        }),
      };

    case 'magic':
      return {
        subject: 'Your instant sign-in link for Studzy',
        html: renderEmailLayout({
          badgeText: 'Magic Link',
          heading: 'Sign in to Studzy',
          greetingName: data.name,
          contentHtml: '<p style="margin: 0;">Click the button below to sign in instantly to your Studzy account. No password required.</p>',
          ctaText: 'Sign In Now',
          ctaUrl: data.link,
          subtext: 'This one-time magic link will expire shortly for your security.',
        }),
      };
  }
};

/**
 * Email sent to students when new materials or CBT questions are uploaded.
 */
export const getNewContentEmail = (data: {
  kind: 'resource' | 'questions' | 'batch_resources';
  courseCode: string;
  courseTitle: string;
  url: string;
  recipientName?: string | null;
  itemTitle?: string;
  resourceType?: string;
  count?: number;
  items?: Array<{ title: string; type: string; url?: string }>;
}) => {
  const courseCode = escapeHtml(data.courseCode);
  const courseTitle = escapeHtml(data.courseTitle);
  const courseFull = `${courseCode} – ${courseTitle}`;

  if (data.kind === 'batch_resources') {
    const itemsCount = data.items?.length || 1;
    const subject = `${itemsCount} new study materials in ${data.courseCode}`;
    const heading = `${itemsCount} New Materials Added in ${data.courseCode}`;

    const itemsHtml = (data.items || []).map((item) => {
      const badge = RESOURCE_TYPE_BADGE[item.type] || { label: item.type, bg: '#334155', color: '#cbd5e1' };
      return `
        <div style="padding: 12px 16px; margin-bottom: 8px; background-color: #1e212e; border: 1px solid #2b3044; border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #f1f5f9; font-size: 14px; font-weight: 600;">${escapeHtml(item.title)}</span>
          <span style="display: inline-block; padding: 3px 8px; background-color: ${badge.bg}; color: ${badge.color}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">
            ${escapeHtml(badge.label)}
          </span>
        </div>
      `;
    }).join('');

    const contentHtml = `
      <p style="margin: 0 0 16px 0;">New learning resources have just been uploaded for <strong style="color: #60a5fa;">${courseFull}</strong>:</p>
      <div style="margin: 16px 0;">
        ${itemsHtml}
      </div>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #94a3b8;">Review these materials now to stay ahead of your semester coursework.</p>
    `;

    return {
      subject,
      html: renderEmailLayout({
        badgeText: courseCode,
        badgeBg: '#4338ca',
        heading,
        greetingName: data.recipientName,
        contentHtml,
        ctaText: 'Access Study Materials',
        ctaUrl: data.url,
        subtext: "You're receiving this update because you are enrolled in Software Engineering coursework at OAU.",
      }),
    };
  }

  if (data.kind === 'resource') {
    const badge = RESOURCE_TYPE_BADGE[data.resourceType ?? ''] ?? { label: 'Resource', bg: '#334155', color: '#cbd5e1' };
    const subject = `New ${badge.label} in ${data.courseCode}`;
    const heading = `New ${badge.label} Added to ${data.courseCode}`;

    const contentHtml = `
      <p style="margin: 0 0 16px 0;">A new resource is now ready for you in <strong style="color: #60a5fa;">${courseFull}</strong>:</p>
      <div style="padding: 14px 18px; margin: 16px 0; background-color: #1e212e; border: 1px solid #2b3044; border-radius: 12px;">
        <span style="display: inline-block; margin-bottom: 6px; padding: 2px 8px; background-color: ${badge.bg}; color: ${badge.color}; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">
          ${escapeHtml(badge.label)}
        </span>
        <h3 style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700;">${escapeHtml(data.itemTitle ?? 'New Study Material')}</h3>
      </div>
      <p style="margin: 12px 0 0 0; font-size: 14px; color: #94a3b8;">Stream audio/video lectures, study notes, or download directly to your device.</p>
    `;

    return {
      subject,
      html: renderEmailLayout({
        badgeText: courseCode,
        badgeBg: '#4338ca',
        heading,
        greetingName: data.recipientName,
        contentHtml,
        ctaText: `View ${badge.label}`,
        ctaUrl: data.url,
        subtext: 'Your next learning milestone is one click away.',
      }),
    };
  }

  // CBT Practice Questions
  const n = data.count ?? 0;
  const subject = `${n} new practice question${n === 1 ? '' : 's'} in ${data.courseCode}`;
  const heading = `${n} New CBT Practice Questions`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0;"><strong style="color: #a78bfa;">${n} new practice question${n === 1 ? '' : 's'}</strong> ${n === 1 ? 'have' : 'have'} been added to the CBT engine for <strong style="color: #60a5fa;">${courseFull}</strong>.</p>
    <div style="padding: 16px; margin: 16px 0; background-color: #1e212e; border: 1px solid #2b3044; border-radius: 12px; text-align: center;">
      <span style="display: block; font-size: 32px; font-weight: 900; color: #a78bfa; font-family: monospace;">${n}</span>
      <span style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Interactive Questions Added</span>
    </div>
    <p style="margin: 12px 0 0 0; font-size: 14px; color: #94a3b8;">Test your speed, test under timed exam conditions, and get instant explanations.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({
      badgeText: 'CBT Practice',
      badgeBg: '#6d28d9',
      heading,
      greetingName: data.recipientName,
      contentHtml,
      ctaText: 'Start CBT Practice',
      ctaUrl: data.url,
      subtext: 'Consistent daily practice dramatically increases exam performance.',
    }),
  };
};
