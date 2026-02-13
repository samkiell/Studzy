/**
 * Run Supabase SQL Migrations
 *
 * Usage:
 *   node scripts/run-migration.mjs [migration-file]
 *
 * Examples:
 *   node scripts/run-migration.mjs                                            # runs ALL pending migrations
 *   node scripts/run-migration.mjs supabase/migrations/admin_enhancements.sql # runs specific file
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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

// Create admin Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSQL(sql) {
  // Split into individual statements and run each one
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    // Use supabase.rpc to call a raw SQL function if available,
    // otherwise fall back to individual operations
    const { error } = await supabase.rpc("exec_sql", {
      query: statement,
    });

    if (error) {
      // If exec_sql RPC doesn't exist, try creating it first
      if (
        error.message.includes("function") &&
        error.message.includes("does not exist")
      ) {
        console.log("   ⚠️  exec_sql function not found, creating it...");
        // We need to create the function via the Management API
        const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
        const createFnSQL = `
          CREATE OR REPLACE FUNCTION exec_sql(query text) 
          RETURNS void 
          LANGUAGE plpgsql 
          SECURITY DEFINER 
          AS $$ 
          BEGIN 
            EXECUTE query; 
          END; 
          $$;
        `;

        // Try the Management API to bootstrap the function
        const mgmtResponse = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ query: createFnSQL }),
          },
        );

        if (!mgmtResponse.ok) {
          // Management API also failed — provide manual instructions
          console.error("");
          console.error("   ❌ Could not auto-create exec_sql function.");
          console.error("");
          console.error(
            "   Please run this SQL once in your Supabase SQL Editor:",
          );
          console.error("   ─────────────────────────────────────────");
          console.error("   CREATE OR REPLACE FUNCTION exec_sql(query text)");
          console.error("   RETURNS void LANGUAGE plpgsql SECURITY DEFINER");
          console.error("   AS $$ BEGIN EXECUTE query; END; $$;");
          console.error("   ─────────────────────────────────────────");
          console.error("");
          console.error("   Then re-run: npm run db:migrate");
          process.exit(1);
        }

        console.log("   ✅ exec_sql function created! Retrying...\n");

        // Retry the original statement
        const { error: retryError } = await supabase.rpc("exec_sql", {
          query: statement,
        });
        if (retryError) {
          throw new Error(retryError.message);
        }
      } else {
        throw new Error(error.message);
      }
    }
  }
}

async function main() {
  const specificFile = process.argv[2];

  let migrationFiles;

  if (specificFile) {
    const fullPath = path.resolve(rootDir, specificFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      process.exit(1);
    }
    migrationFiles = [fullPath];
  } else {
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
