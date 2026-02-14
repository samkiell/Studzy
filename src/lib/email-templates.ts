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
