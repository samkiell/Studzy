import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnv(src) {
  const result = {};
  const regex = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;
  src.split(/\r?\n/).forEach((line) => {
    const match = regex.exec(line);
    if (match) {
      result[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
  return result;
}

const env = parseEnv(fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8'));

const { Resend } = await import('resend');

async function test() {
  try {
    console.log('RESEND_API_KEY:', env.RESEND_API_KEY);
    console.log('RESEND_FROM_EMAIL:', env.RESEND_FROM_EMAIL);
    console.log('NOTIFY_TEST_EMAIL:', env.NOTIFY_TEST_EMAIL);

    const client = new Resend(env.RESEND_API_KEY);
    const result = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: env.NOTIFY_TEST_EMAIL,
      subject: 'Studzy Resend Test',
      html: '<p>Direct Resend test email.</p>',
    });

    console.log('Resend success:', JSON.stringify(result.data));
  } catch (error) {
    console.error('Resend failed:', error);
    process.exit(1);
  }
}

await test();
