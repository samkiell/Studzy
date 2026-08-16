import { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env.local");
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

console.log("-----------------------------------------");
console.log("Checking Filebase Configuration:");
console.log("FILEBASE_BUCKET   :", env.FILEBASE_BUCKET || "studzy");
console.log("FILEBASE_ENDPOINT :", env.FILEBASE_ENDPOINT || "https://s3.filebase.com");
console.log("FILEBASE_ACCESS_KEY:", env.FILEBASE_ACCESS_KEY ? `${env.FILEBASE_ACCESS_KEY.substring(0, 6)}...` : "MISSING");
console.log("FILEBASE_SECRET_KEY:", env.FILEBASE_SECRET_KEY ? "CONFIGURED" : "MISSING");
console.log("-----------------------------------------");

async function run() {
  const s3 = new S3Client({
    endpoint: env.FILEBASE_ENDPOINT || "https://s3.filebase.com",
    region: "us-east-1",
    credentials: {
      accessKeyId: env.FILEBASE_ACCESS_KEY,
      secretAccessKey: env.FILEBASE_SECRET_KEY,
    },
    forcePathStyle: true,
  });

  console.log("\n1. Testing ListBuckets...");
  try {
    const buckets = await s3.send(new ListBucketsCommand({}));
    const names = buckets.Buckets?.map((b) => b.Name) || [];
    console.log(`✅ Success! Found ${names.length} bucket(s):`, names);
  } catch (err) {
    console.error("❌ ListBuckets failed:", err.message);
  }

  const bucketName = env.FILEBASE_BUCKET || "studzy";
  console.log(`\n2. Testing ListObjects for bucket '${bucketName}'...`);
  try {
    const objects = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
    const keys = objects.Contents?.map((o) => o.Key) || [];
    console.log(`✅ Success! Found ${keys.length} object(s) in '${bucketName}':`, keys);
  } catch (err) {
    console.error(`❌ ListObjects failed for '${bucketName}':`, err.message);
  }

  console.log(`\n3. Testing PutObject (test upload) to '${bucketName}'...`);
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: "test-connection.txt",
        Body: "Filebase S3 connection working!",
        ContentType: "text/plain",
      })
    );
    console.log(`✅ Test upload successful! Object 'test-connection.txt' written to '${bucketName}'.`);
  } catch (err) {
    console.error(`❌ Test upload failed:`, err.message);
  }

  console.log("\n-----------------------------------------");
}

run();
