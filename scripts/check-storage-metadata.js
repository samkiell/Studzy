const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Basic .env.local loader
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val)
    env[key.trim()] = val
      .join("=")
      .trim()
      .replace(/^"(.*)"$/, "$1");
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

async function check() {
  const { data, error } = await supabase.storage
    .from("RAG")
    .list("pdf", { limit: 5 });
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("--- Storage Sample ---");
  data.forEach((f) => {
    console.log("File:", f.name);
    console.log("Metadata:", JSON.stringify(f.metadata));
    console.log("---");
  });
}

check();
