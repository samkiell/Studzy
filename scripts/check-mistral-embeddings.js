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

const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });

async function check() {
  const query = "tell me about my courses";
  console.log("Query:", query);

  try {
    const response = await client.embeddings.create({
      model: "mistral-embed",
      inputs: [query],
    });

    const embedding = response.data?.[0]?.embedding;
    console.log("--- Generated Embedding ---");
    console.log("Type:", typeof embedding);
    console.log("Is Array?", Array.isArray(embedding));
    if (embedding) {
      console.log("Dimension:", embedding.length);
      console.log("First 5 values:", embedding.slice(0, 5));
      const isZero = embedding.every((v) => v === 0);
      console.log("Is all zeros?", isZero);

      const sumSq = embedding.reduce((sum, v) => sum + v * v, 0);
      console.log("Magnitude squared:", sumSq);
    }
  } catch (err) {
    console.error("API Error:", err.message);
  }
}

check();
