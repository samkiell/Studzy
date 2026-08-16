import { NextResponse } from 'next/server';
import { queueEmail } from '@/lib/email';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, uploadId } = await request.json();

    // Queue the email to avoid blocking the user's UI/request
    queueEmail({
      to: user.email,
      subject: 'Upload Successful',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #7c3aed;">File Uploaded Successfully</h2>
          <p>Your file <strong>${fileName}</strong> has been uploaded and is being processed.</p>
          <p>Upload ID: <code>${uploadId}</code></p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">
            View Dashboard
          </a>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'Upload recorded and email queued' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
