import { NextResponse } from 'next/server';
import { queueEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, uploadId } = await request.json();

    // In production, you would save the upload to DB first
    // const { data, error } = await supabase.from('uploads').insert({ ... });

    // Queue the email to avoid blocking the user's UI/request
    queueEmail({
      to: user.email!,
      subject: 'Upload Successful',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #7c3aed;">File Uploaded Successfully</h2>
          <p>Your file <strong>${fileName}</strong> has been uploaded and is being processed.</p>
          <p>Upload ID: <code>${uploadId}</code></p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/uploads" 
             style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">
            View Uploads
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
