import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manual .env.local loader
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split("\n").forEach((line) => {
    const [key, ...val] = line.split("=");
    if (key && val.length > 0) {
      env[key.trim()] = val.join("=").trim().replace(/^"(.*)"$/, "$1");
    }
  });
  return env;
}

const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeStorage() {
  console.log("🚀 Analyzing Supabase Storage...");
  
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  
  if (bucketError) {
    console.error("❌ Error fetching buckets:", bucketError);
    return;
  }

  let totalSize = 0;
  let fileCount = 0;
  const filesToDelete = []; // Grouped by bucket: { bucketName: [paths] }
  const bucketMap = {};

  for (const bucket of buckets) {
    console.log(`📦 Checking bucket: ${bucket.name}`);
    bucketMap[bucket.name] = [];
    
    async function listAllFiles(folder = "") {
      const { data, error } = await supabase.storage.from(bucket.name).list(folder);
      
      if (error) {
        console.error(`❌ Error listing files in ${bucket.name}/${folder}:`, error);
        return;
      }

      for (const item of data) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        
        if (item.id === null) {
          await listAllFiles(itemPath);
        } else {
          fileCount++;
          const size = item.metadata?.size || 0;
          totalSize += size;
          
          const ext = item.name.split('.').pop().toLowerCase();
          const targetExtensions = ['pdf', 'mp4', 'mkv', 'avi', 'mov', 'webm', 'mp3', 'wav', 'm4a', 'aac', 'ogg'];
          
          if (targetExtensions.includes(ext)) {
            bucketMap[bucket.name].push(itemPath);
          }
        }
      }
    }

    await listAllFiles();
  }

  const totalTargeted = Object.values(bucketMap).reduce((acc, paths) => acc + paths.length, 0);

  console.log("\n--- Storage Report ---");
  console.log(`Total Files Found: ${fileCount}`);
  console.log(`Targeted Files (PDF, Video, Audio): ${totalTargeted}`);
  console.log(`Total Storage Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB (${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB)`);
  
  if (totalTargeted === 0) {
    console.log("✅ No files found to delete.");
    return;
  }

  if (process.argv.includes('--execute')) {
    console.log("\n🧨 Nuking files in batches...");
    
    for (const [bucketName, paths] of Object.entries(bucketMap)) {
      if (paths.length === 0) continue;
      
      console.log(`\n🧹 Cleaning ${bucketName} (${paths.length} files)...`);
      
      // Supabase remove takes an array. We'll batch them (e.g., 50 at a time) to avoid request size limits or timeouts
      const BATCH_SIZE = 50;
      for (let i = 0; i < paths.length; i += BATCH_SIZE) {
        const batch = paths.slice(i, i + BATCH_SIZE);
        console.log(`   Deleting batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(paths.length/BATCH_SIZE)}...`);
        
        try {
          const { error } = await supabase.storage.from(bucketName).remove(batch);
          if (error) {
            console.error(`   ❌ Failed to delete batch in ${bucketName}:`, error.message);
          } else {
            console.log(`   ✅ Deleted ${batch.length} files.`);
          }
        } catch (err) {
          console.error(`   ❌ Unexpected error in ${bucketName}:`, err.message);
        }
        
        // Brief pause to avoid overwhelming the API
        await new Promise(r => setTimeout(r, 500));
      }
    }
    console.log("\n✨ Nuke complete.");
  } else {
    console.log("\n💡 Run with '--execute' to actually DELETE the files.");
  }
}

analyzeStorage().catch(console.error);
