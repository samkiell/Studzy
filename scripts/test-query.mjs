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
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testQuery() {
  const courseCode = "MTH201";
  const resourceSlug = "the-art-of-approximation";

  console.log(`Testing query for ${courseCode} / ${resourceSlug}`);

  const { data, error } = await supabase
    .from("resources")
    .select("title, description, courses!inner(code, title)")
    .eq("slug", resourceSlug)
    .eq("courses.code", courseCode)
    .maybeSingle();

  if (error) {
    console.error("Query Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Query Result:", JSON.stringify(data, null, 2));
  }
}

testQuery();
