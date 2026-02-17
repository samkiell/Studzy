const { createClient } = require("@supabase/supabase-js");
const { Mistral } = require("@mistralai/mistralai");
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
const mistral = new Mistral({ apiKey: env.MISTRAL_API_KEY });

async function check() {
  const query = "timetable";
  console.log("Query:", query);

  try {
    const resp = await mistral.embeddings.create({
      model: "mistral-embed",
      inputs: [query],
    });
    const embedding = resp.data[0].embedding;
    const vectorStr = `[${embedding.join(",")}]`;

    console.log('Attempting manual SQL search via .rpc("exec_sql")...');
    // Note: exec_sql might not be available yet if the user hasn't run the consolidated SQL
    // But we can try a direct query if we had a way. Supabase JS doesn't have .unsafe_sql.
    // However, we can use the match_embeddings RPC but with more logging.

    const { data: rpcResults, error: rpcError } = await supabase.rpc(
      "match_embeddings",
      {
        query_embedding: vectorStr,
        match_threshold: 0.0, // Absolute minimum
        match_count: 5,
      },
    );

    if (rpcError) {
      console.error("RPC Error:", rpcError);
      // If it's a signature mismatch, this will tell us
    } else {
      console.log("RPC Results (threshold 0.0):", rpcResults?.length || 0);
      if (rpcResults && rpcResults.length > 0) {
        console.log("First result similarity:", rpcResults[0].similarity);
      }
    }

    // Let's also check if the table has any embeddings at all with non-zero magnitude
    const { data: countData } = await supabase
      .rpc("exec_sql", {
        query:
          "SELECT count(*) FROM study_material_embeddings WHERE embedding IS NOT NULL",
      })
      .catch((e) => ({ data: null }));

    if (countData) console.log("Count with embeddings:", countData);
  } catch (err) {
    console.error("Failure:", err.message);
  }
}

check();
