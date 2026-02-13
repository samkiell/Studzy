/**
 * Run Supabase SQL Migrations
 *
 * Usage:
 *   node scripts/run-migration.mjs [migration-file]
 *
 * Examples:
 *   node scripts/run-migration.mjs                                          # runs ALL pending migrations
 *   node scripts/run-migration.mjs supabase/migrations/admin_enhancements.sql  # runs specific file
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// Load .env.local
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  console.error("");
  console.error("Add it to your .env.local file:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here");
  console.error("");
  console.error(
    "Find it at: Supabase Dashboard → Settings → API → service_role key",
  );
  process.exit(1);
}

// Extract project ref from URL (e.g., https://abcdef.supabase.co → abcdef)
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

async function runSQL(sql) {
  // Use the Supabase REST SQL endpoint (requires service role key)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  // If RPC doesn't exist, try the PostgreSQL query endpoint
  if (!response.ok) {
    // Fallback: use Supabase's pg endpoint
    const pgResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!pgResponse.ok) {
      // Final fallback: Management API
      const mgmtResponse = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ query: sql }),
        },
      );

      if (!mgmtResponse.ok) {
        const errorText = await mgmtResponse.text();
        throw new Error(`SQL execution failed: ${errorText}`);
      }
      return await mgmtResponse.json();
    }
    return await pgResponse.json();
  }

  return await response.json();
}

async function main() {
  const specificFile = process.argv[2];

  let migrationFiles;

  if (specificFile) {
    // Run a specific migration file
    const fullPath = path.resolve(rootDir, specificFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      process.exit(1);
    }
    migrationFiles = [fullPath];
  } else {
    // Run all migration files in order
    const migrationsDir = path.join(rootDir, "supabase", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.error("❌ No migrations directory found");
      process.exit(1);
    }
    migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => path.join(migrationsDir, f));
  }

  if (migrationFiles.length === 0) {
    console.log("✅ No migrations to run");
    return;
  }

  console.log(`\n🔄 Running ${migrationFiles.length} migration(s)...\n`);

  for (const file of migrationFiles) {
    const fileName = path.basename(file);
    const sql = fs.readFileSync(file, "utf-8");

    console.log(`📄 ${fileName}`);

    try {
      await runSQL(sql);
      console.log(`   ✅ Success\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      process.exit(1);
    }
  }

  console.log("🎉 All migrations completed!\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
