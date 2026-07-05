import { sendEmail } from "../src/lib/email";

async function main() {
  console.log("Testing email to:", process.env.NOTIFY_TEST_EMAIL);
  console.log("SMTP_USER:", process.env.SMTP_USER);
  try {
    await sendEmail({
      to: process.env.NOTIFY_TEST_EMAIL || "",
      subject: "Test email from Studzy",
      html: "<p>This is a test email to verify that the email functionality is working.</p>",
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

main();
