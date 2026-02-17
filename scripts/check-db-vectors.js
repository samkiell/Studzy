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
  const { data, error } = await supabase
    .from("study_material_embeddings")
    .select("id, file_path, embedding")
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No data found in study_material_embeddings");
    return;
  }

  const embedding = data[0].embedding;
  console.log("--- DB Sample ---");
  console.log("ID:", data[0].id);
  console.log("File:", data[0].file_path);
  console.log("Embedding type:", typeof embedding);
  console.log("Is Array?", Array.isArray(embedding));
  if (embedding) {
    const vector = Array.isArray(embedding)
      ? embedding
      : typeof embedding === "string"
        ? JSON.parse(embedding)
        : [];
    console.log("Dimension:", vector.length);
    console.log("First 5 values:", vector.slice(0, 5));
    const isZero = vector.every((v) => v === 0);
    console.log("Is all zeros?", isZero);
  } else {
    console.log("Embedding is NULL");
  }
}

check();
