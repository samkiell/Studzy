import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      env[trimmed.substring(0, eqIndex)] = trimmed.substring(eqIndex + 1);
    }
  }
});

const sql = neon(env.DATABASE_URL);
const s3 = new S3Client({
  endpoint: env.FILEBASE_ENDPOINT || "https://s3.filebase.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: env.FILEBASE_ACCESS_KEY,
    secretAccessKey: env.FILEBASE_SECRET_KEY,
  },
  forcePathStyle: true,
});
const bucket = env.FILEBASE_BUCKET || "studzy";

async function run() {
  console.log("1. Fetching all question bank resources from Neon DB...");
  const qbResources = await sql`
    SELECT id, title, type, file_url, course_id, (SELECT code FROM courses WHERE id = resources.course_id) as course_code
    FROM resources
    WHERE type = 'question_bank' OR file_url LIKE '%supabase%'
  `;

  console.log(`Found ${qbResources.length} question bank / supabase resources.`);

  for (const res of qbResources) {
    const code = res.course_code || res.title.replace(/\.json$/i, "").toUpperCase();
    console.log(`\nProcessing ${res.title} (Course: ${code})...`);

    // Fetch questions for this course from Neon DB
    const questionsList = await sql`
      SELECT question_id as id, question_text as question, options, correct_option as answer, explanation, topic, difficulty, question_type, model_answer
      FROM questions
      WHERE LOWER(course_code) = LOWER(${code}) OR course_id = ${res.course_id}
      ORDER BY question_id
    `;

    console.log(`  Found ${questionsList.length} questions in Neon DB.`);

    let jsonContent;
    if (questionsList.length > 0) {
      jsonContent = JSON.stringify(questionsList, null, 2);
    } else {
      // Fallback try to fetch from existing url if accessible
      try {
        const resp = await fetch(res.file_url);
        if (resp.ok) {
          jsonContent = await resp.text();
          console.log("  Fetched from original URL.");
        }
      } catch (e) {
        console.warn("  Could not fetch from original URL:", e.message);
      }
    }

    if (jsonContent) {
      // If this is mth202, save locally in root
      if (code.toLowerCase().includes("mth202") || res.title.toLowerCase().includes("mth202")) {
        fs.writeFileSync(path.join(__dirname, "..", "mth202.json"), jsonContent, "utf-8");
        console.log("  >>> SAVED mth202.json to project root directory!");
      }

      // Upload to Filebase S3
      const s3Key = `materials/question_bank/${code.toLowerCase()}_questions.json`;
      console.log(`  Uploading to Filebase S3: ${s3Key}...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: Buffer.from(jsonContent, "utf-8"),
          ContentType: "application/octet-stream",
        })
      );

      // Update resource in Neon DB to point to Filebase proxy URL
      const newFileUrl = `/api/storage/${s3Key}`;
      await sql`
        UPDATE resources
        SET file_url = ${newFileUrl}
        WHERE id = ${res.id}
      `;
      console.log(`  Updated DB record to ${newFileUrl}`);
    }
  }

  // Also check if any remaining resources in DB point to supabase
  const remainingSupabase = await sql`
    SELECT id, title, file_url FROM resources WHERE file_url LIKE '%supabase%'
  `;
  console.log(`\nRemaining Supabase resources in DB: ${remainingSupabase.length}`);
}

run().catch(console.error);
