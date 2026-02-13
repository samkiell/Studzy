import { createClient } from "@supabase/supabase-js";
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
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectProfiles() {
  const { data, error } = await supabase.rpc("exec_sql", {
    sql_query:
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'",
  });

  if (error) {
    console.error("Inspection Error:", error);
  } else {
    console.log("Profiles Table Columns:");
    console.table(data);
  }
}

inspectProfiles();
