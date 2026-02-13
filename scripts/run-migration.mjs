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
 *
 * FIRST TIME SETUP:
 *   Run this SQL once in your Supabase SQL Editor (Dashboard > SQL Editor):
 *
 *   CREATE OR REPLACE FUNCTION exec_sql(query text)
 *   RETURNS void LANGUAGE plpgsql SECURITY DEFINER
 *   AS $$ BEGIN EXECUTE query; END; $$;
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

/**
 * Split SQL into statements, respecting $$ blocks (DO blocks, function bodies)
 */
function splitSQL(sql) {
  const results = [];
  let current = "";
  let inDollarBlock = false;

  const lines = sql.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip pure comment lines outside $$ blocks
    if (trimmed.startsWith("--") && !inDollarBlock) {
      continue;
    }

    // Track $$ blocks
    const dollarMatches = (trimmed.match(/\$\$/g) || []).length;
    if (dollarMatches % 2 === 1) {
      inDollarBlock = !inDollarBlock;
    }

    current += line + "\n";

    // End of statement: semicolon at end of line, not inside $$ block
    if (trimmed.endsWith(";") && !inDollarBlock) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        results.push(stmt);
      }
      current = "";
    }
  }

  const remaining = current.trim();
  if (remaining.length > 0) {
    results.push(remaining);
  }

  return results;
}

async function runSQL(sql) {
  const statements = splitSQL(sql);

  for (const statement of statements) {
    const { error } = await supabase.rpc("exec_sql", {
      query: statement,
    });

    if (error) {
      if (
        error.message.includes("schema cache") ||
        error.message.includes("does not exist")
      ) {
        console.error("");
        console.error("   ❌ The exec_sql function is not available.");
        console.error("");
        console.error(
          "   Please run this SQL ONCE in your Supabase SQL Editor:",
        );
        console.error(
          "   ──────────────────────────────────────────────────────",
        );
        console.error("   CREATE OR REPLACE FUNCTION exec_sql(query text)");
        console.error("   RETURNS void LANGUAGE plpgsql SECURITY DEFINER");
        console.error("   AS $$ BEGIN EXECUTE query; END; $$;");
        console.error(
          "   ──────────────────────────────────────────────────────",
        );
        console.error("");
        console.error("   Then re-run: npm run db:migrate");
        process.exit(1);
      }
      throw new Error(error.message);
    }
  }
}

async function main() {
  // First, test if exec_sql is available
  console.log("🔍 Checking exec_sql function...");
  const { error: testError } = await supabase.rpc("exec_sql", {
    query: "SELECT 1",
  });

  if (testError) {
    if (
      testError.message.includes("schema cache") ||
      testError.message.includes("does not exist")
    ) {
      console.error("");
      console.error(
        "❌ The exec_sql function is not available in your database.",
      );
      console.error("");
      console.error("Run this SQL ONCE in Supabase Dashboard → SQL Editor:");
      console.error("────────────────────────────────────────────────────────");
      console.error("CREATE OR REPLACE FUNCTION exec_sql(query text)");
      console.error("RETURNS void LANGUAGE plpgsql SECURITY DEFINER");
      console.error("AS $$ BEGIN EXECUTE query; END; $$;");
      console.error("────────────────────────────────────────────────────────");
      console.error("");
      console.error("Then re-run: npm run db:migrate");
      process.exit(1);
    }
    console.error("❌ Unexpected error:", testError.message);
    process.exit(1);
  }
  console.log("✅ exec_sql function ready\n");

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

  console.log(`🔄 Running ${migrationFiles.length} migration(s)...\n`);

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
