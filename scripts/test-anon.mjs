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

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testAnonQuery() {
  const courseCode = "CSC201";
  console.log(`Testing ANON query for course: ${courseCode}`);

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("code", courseCode)
    .maybeSingle();

  if (error) {
    console.error("Anon Query Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Anon Query Result:", data);
  }
}

testAnonQuery();
