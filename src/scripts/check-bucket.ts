
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load env vars from .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join("=").trim().replace(/^"|"$/g, "");
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY). Ensure .env.local is loaded or vars are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listFiles() {
  console.log("Listing files in RAG bucket...");
  const { data, error } = await supabase.storage.from("RAG").list();
  
  if (error) {
    console.error("Error listing files:", error);
    return;
  }
  
  console.log(`Files in RAG bucket (${data.length}):`);
  if (data.length === 0) {
    console.log("(No files found)");
  }
  data.forEach((f) => console.log(`- ${f.name} (${(f.metadata.size / 1024).toFixed(2)} KB)`));
}

listFiles();
