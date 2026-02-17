/**
 * Standalone Launch Cleanup Script
 *
 * Usage:
 *   node scripts/launch-cleanup.mjs
 *
 * This script clears all tracking data, activity logs, and resets user stats.
 * It loads credentials from .env.local.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// 1. Load .env.local
const envPath = path.join(rootDir, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found at root.");
  process.exit(1);
}

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

// 2. Create Admin Client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🚀 Starting PRODUCTION LAUNCH CLEANUP...");
  console.log("------------------------------------------");

  // A. Tables to truncate (delete all records)
  const tablesToClear = [
    "user_activity",
    "user_progress",
    "study_presence",
    "bookmarks",
    "chat_messages",
    "chat_sessions",
  ];

  for (const table of tablesToClear) {
    process.stdout.write(`🧹 Clearing ${table}... `);

    // Some tables might not have an 'id' column (e.g., study_presence uses composite keys)
    const filterColumn = table === "study_presence" ? "user_id" : "id";

    const { error } = await supabase
      .from(table)
      .delete()
      .neq(filterColumn, "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.log(`❌ Failed: ${error.message}`);
    } else {
      console.log(`✅ Done`);
    }
  }

  // B. Reset Resource Stats
  process.stdout.write(`📊 Resetting resource view/completion counts... `);
  const { error: resourceError } = await supabase
    .from("resources")
    .update({ view_count: 0, completion_count: 0 })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (resourceError) {
    console.log(`❌ Failed: ${resourceError.message}`);
  } else {
    console.log(`✅ Done`);
  }

  // C. Reset User Stats
  process.stdout.write(
    `👤 Resetting user profile stats (streaks, study time)... `,
  );
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      total_study_seconds: 0,
      current_streak: 0,
      longest_streak: 0,
      last_login_date: null,
    })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (profileError) {
    console.log(`❌ Failed: ${profileError.message}`);
  } else {
    console.log(`✅ Done`);
  }

  console.log("------------------------------------------");
  console.log("🎉 Cleanup Complete! Application ready for launch.\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error during cleanup:", err.message);
  process.exit(1);
});
