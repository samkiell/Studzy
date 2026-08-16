import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FILEBASE_BUCKET = process.env.FILEBASE_BUCKET || "studzy";
const FILEBASE_ENDPOINT = process.env.FILEBASE_ENDPOINT || "https://s3.filebase.com";
const FILEBASE_ACCESS_KEY = process.env.FILEBASE_ACCESS_KEY;
const FILEBASE_SECRET_KEY = process.env.FILEBASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Skipping Supabase bucket download.");
}

if (!FILEBASE_ACCESS_KEY || !FILEBASE_SECRET_KEY) {
  console.error("❌ FILEBASE credentials missing!");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: FILEBASE_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: FILEBASE_ACCESS_KEY,
    secretAccessKey: FILEBASE_SECRET_KEY,
  },
  forcePathStyle: true,
});

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

async function checkFilebaseFileExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: FILEBASE_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToFilebase(key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: FILEBASE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType || "application/octet-stream",
    })
  );
  console.log(`✅ Uploaded to Filebase: ${key} -> https://${FILEBASE_BUCKET}.s3.filebase.com/${key}`);
}

async function listSupabaseBucketFiles(bucket, folder = "") {
  if (!supabase) return [];
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  if (error || !data) {
    console.warn(`Could not list bucket ${bucket}/${folder}:`, error?.message);
    return [];
  }

  let files = [];
  for (const item of data) {
    if (item.name === ".emptyFolderPlaceholder") continue;
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    if (!item.id || !item.metadata) {
      const subFiles = await listSupabaseBucketFiles(bucket, fullPath);
      files.push(...subFiles);
    } else {
      files.push({
        bucket,
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || "application/octet-stream",
      });
    }
  }
  return files;
}

async function runStorageMigration() {
  console.log("🚀 Starting Storage Migration from Supabase to Filebase S3...");
  console.log(`Target Bucket: ${FILEBASE_BUCKET}`);
  console.log(`Endpoint: ${FILEBASE_ENDPOINT}\n`);

  if (!supabase) {
    console.log("No Supabase instance configured. Migration complete.");
    return;
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Error listing Supabase buckets:", bucketError.message);
    return;
  }

  console.log(`Found ${buckets.length} Supabase bucket(s): ${buckets.map((b) => b.name).join(", ")}\n`);

  let totalFiles = 0;
  let copiedFiles = 0;
  let skippedFiles = 0;

  for (const bucket of buckets) {
    console.log(`📦 Scanning bucket: ${bucket.name}...`);
    const files = await listSupabaseBucketFiles(bucket.name);
    console.log(`Found ${files.length} file(s) in bucket ${bucket.name}`);

    for (const file of files) {
      totalFiles++;
      const destinationKey = `${bucket.name}/${file.path}`;

      const exists = await checkFilebaseFileExists(destinationKey);
      if (exists) {
        console.log(`⏩ Skipping (already in Filebase): ${destinationKey}`);
        skippedFiles++;
        continue;
      }

      console.log(`⬇️ Downloading ${bucket.name}/${file.path} (${(file.size / 1024).toFixed(1)} KB)...`);
      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucket.name)
        .download(file.path);

      if (downloadError || !blob) {
        console.error(`❌ Download failed for ${bucket.name}/${file.path}:`, downloadError?.message);
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());
      await uploadToFilebase(destinationKey, buffer, file.mimetype);
      copiedFiles++;
    }
  }

  console.log("\n=================================");
  console.log(`🎉 Storage Migration Completed!`);
  console.log(`Total scanned: ${totalFiles}`);
  console.log(`Copied to Filebase: ${copiedFiles}`);
  console.log(`Already present / Skipped: ${skippedFiles}`);
  console.log("=================================\n");
}

runStorageMigration().catch((err) => {
  console.error("Fatal error during storage migration:", err);
  process.exit(1);
});
