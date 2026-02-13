import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Read env file
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val.length) env[key.trim()] = val.join("=").trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const { data: courses } = await supabase
  .from("courses")
  .select("id, code, title");
console.log("=== COURSES ===");
console.log(JSON.stringify(courses, null, 2) || "No courses");

const { data: resources } = await supabase
  .from("resources")
  .select("id, title, type, file_url")
  .order("created_at", { ascending: false });
console.log("\n=== RESOURCES ===");
console.log(JSON.stringify(resources, null, 2) || "No resources");
console.log("\nTotal:", resources?.length || 0, "resources");

process.exit(0);
